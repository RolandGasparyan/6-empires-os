"""OpenAI-compatible shim at ROOT /v1.

Branded models (empire-router/mistral/hermes) now answer with a big, ChatGPT-class
brain: requests are routed to Groq (llama-3.3-70b-versatile) when a Groq key is
present, with the local Ollama model as an automatic fallback if Groq errors or is
rate-limited. This gives natural, varied, human answers instead of the tiny local
model's repetitive/templated ones — while keeping the same /v1 contract used by
OpenHuman, EMPIRE PRIME, and the public web chat.
"""
import json as _json
import os
import re as _re
import time as _t
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from model_router import ChatRequest, OLLAMA_URL, _route

oai = APIRouter(tags=["openai-compat"])
# The last 3 are explicit privacy-mode picks (choose in any model dropdown):
#   empire-local  = 100% on your VPS (private)   empire-cloud = always Groq 70B
#   empire-hybrid = greetings local, questions Groq (same as the default models)
_MODELS = ["empire-router", "empire-mistral", "empire-hermes",
           "empire-local", "empire-hybrid", "empire-cloud"]


def _use_groq(model, msgs):
    """Decide local vs Groq. Explicit mode models override the content heuristic."""
    m = (model or "").lower()
    if m.endswith("local"):
        return False
    if m.endswith("cloud") or m.endswith("groq"):
        return bool(_live_groq_key())
    # hybrid (default for empire-router/mistral/hermes/hybrid)
    return bool(_live_groq_key()) and _is_heavy(msgs)

# Local default model (private, on your own server). Kept warm on CPU.
_CHAT_MODEL = os.getenv("MODEL_CHAT", "mistral")

# HYBRID routing: casual chat stays 100% local/private on your VPS; only genuinely
# heavy requests (strategy, analysis, long prompts) escalate to the Groq big brain.
_HEAVY_RE = _re.compile(
    r"strateg|analy|plan|invest|forecast|research|compare|roadmap|financ|market|"
    r"deep dive|write |draft |code|debug|optimi|architect|proposal|memo|report",
    _re.I)


_GREETING_RE = _re.compile(r"^\s*(hi|hey|hello|yo|sup|barev|привет|ok|okay|thanks|thank you|"
                           r"lol|nice|cool|good|great|bye)[\s!.,?]*$", _re.I)


def _is_heavy(msgs):
    """Substantive messages go to the Groq big brain; only trivial greetings stay local."""
    last = ""
    for m in reversed(msgs):
        if isinstance(m, dict) and m.get("role") == "user":
            last = m.get("content") or ""
            break
    # Trivial greetings/acks stay local (private, instant). Everything with real
    # substance goes to the Groq big brain so answers stay ChatGPT-class.
    if _GREETING_RE.match(last or ""):
        return False
    return True

# Groq big-brain (ChatGPT-class). The live key is read from a shared key file that
# the admin page writes, so updates take effect instantly with NO restart; falls
# back to the env var if the file is missing.
_KEYS_FILE = os.getenv("EMPIRE_KEYS_FILE", "/app/keys.json")
_ENV_GROQ_KEY = (os.getenv("FREE_GROQ_KEY") or os.getenv("GROQ_API_KEY") or "").strip()


def _live_groq_key():
    try:
        with open(_KEYS_FILE) as f:
            k = (_json.load(f).get("FREE_GROQ_KEY") or "").strip()
            if k:
                return k
    except Exception:
        pass
    return _ENV_GROQ_KEY


# kept for module-load references; real checks call _live_groq_key()
_GROQ_KEY = _live_groq_key()
_GROQ_MODEL = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")
_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_TEMP = float(os.getenv("GROQ_TEMP", "0.9"))     # variety -> less repetition
_GROQ_MAXTOK = min(max(int(os.getenv("GROQ_MAXTOK", "1024")), 1), 2_048)
_MAX_MESSAGES = 40
_MAX_FRAGMENT_CHARS = 8_000
_MAX_CONTEXT_CHARS = 32_000

# Human, ChatGPT-style persona. Injected only when the caller sends no system msg,
# so the public web chat (which supplies its own GOD-MODE prompt) is untouched.
_DEFAULT_SYSTEM = os.getenv("EMPIRE_PERSONA",
    "You are EMPIRE, a warm, sharp, human-sounding AI assistant. Talk naturally and "
    "conversationally, like a smart helpful friend. Vary your wording and openings every "
    "time — never reuse the same intro or a canned template. Match the length to the "
    "message: keep small talk short (1-3 sentences), go deeper only when the question "
    "truly needs it. Never say you are 'a large language model' or that you 'don't have "
    "feelings'; just be personable, direct, and genuinely helpful.")


def _with_persona(msgs):
    """Prepend the EMPIRE persona unless the caller already set a system message."""
    if any(isinstance(m, dict) and m.get("role") == "system" for m in msgs):
        return msgs
    return [{"role": "system", "content": _DEFAULT_SYSTEM}] + list(msgs)


@oai.get("/v1/models")
async def models():
    return {"object": "list",
            "data": [{"id": m, "object": "model", "created": int(_t.time()), "owned_by": "6-empire"}
                     for m in _MODELS]}


def _mk_messages(msgs):
    out = []
    for m in msgs:
        if isinstance(m, dict) and m.get("role") and m.get("content") is not None:
            out.append({"role": m["role"], "content": m["content"]})
    return out


def _validated_messages(raw):
    if not isinstance(raw, list):
        raise HTTPException(status_code=422, detail="messages must be a list")
    if len(raw) > _MAX_MESSAGES:
        raise HTTPException(status_code=413, detail=f"messages is limited to {_MAX_MESSAGES} items")
    messages = []
    total = 0
    for item in raw:
        if not isinstance(item, dict):
            raise HTTPException(status_code=422, detail="each message must be an object")
        role = item.get("role")
        if role == "system":
            raise HTTPException(status_code=422, detail="client system messages are not allowed")
        if role not in {"user", "assistant"}:
            raise HTTPException(status_code=422, detail="message role must be user or assistant")
        content = item.get("content")
        if not isinstance(content, str):
            raise HTTPException(status_code=422, detail="message content must be text")
        if len(content) > _MAX_FRAGMENT_CHARS:
            raise HTTPException(status_code=413, detail="message content exceeds the per-message limit")
        total += len(content)
        if total > _MAX_CONTEXT_CHARS:
            raise HTTPException(status_code=413, detail="message context exceeds the total limit")
        messages.append({"role": role, "content": content})
    return messages


def _mk_cr(msgs):
    return ChatRequest(
        message=msgs[-1]["content"] if msgs else "",
        system=next((m["content"] for m in msgs if m.get("role") == "system"), None),
        history=[m for m in msgs[:-1] if m.get("role") != "system"] or None,
    )


async def _resolve_ollama_model():
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(f"{OLLAMA_URL}/api/tags")
            tags = [t["name"] for t in r.json().get("models", [])]
        base = _CHAT_MODEL.split(":")[0]
        return next((t for t in tags if t.split(":")[0] == base), _CHAT_MODEL)
    except Exception:
        return _CHAT_MODEL


def _groq_headers():
    return {"Authorization": f"Bearer {_live_groq_key()}", "Content-Type": "application/json",
            "User-Agent": "curl/8.4.0"}


def _groq_payload(msgs, stream):
    return {"model": _GROQ_MODEL, "messages": _mk_messages(_with_persona(msgs)),
            "temperature": _GROQ_TEMP, "max_tokens": _GROQ_MAXTOK, "stream": stream}


async def _groq_complete(msgs):
    """Non-stream Groq call. Returns text, or None on failure."""
    if not _live_groq_key():
        return None
    try:
        async with httpx.AsyncClient(timeout=45) as c:
            r = await c.post(_GROQ_URL, headers=_groq_headers(), json=_groq_payload(msgs, False))
            if r.status_code != 200:
                return None
            d = r.json()
            return (d.get("choices") or [{}])[0].get("message", {}).get("content") or None
    except Exception:
        return None


@oai.post("/v1/chat/completions")
async def chat(req: Request):
    b = await req.json()
    if not isinstance(b, dict):
        raise HTTPException(status_code=422, detail="request body must be an object")
    model = str(b.get("model", "empire-router"))[:100]
    msgs = _validated_messages(b.get("messages", []))
    stream = bool(b.get("stream", False))
    cid = f"empire-{int(_t.time())}"
    created = int(_t.time())

    async def _local_complete():
        cr = _mk_cr(_with_persona(msgs))
        cr.force_provider = "ollama"
        out = await _route("chat", cr)
        return out.get("response") or ""

    # ---- NON-STREAM (hybrid: heavy->Groq first, casual->local first) ----
    if not stream:
        text = ""
        if _use_groq(model, msgs):
            text = await _groq_complete(msgs) or await _local_complete()
        else:
            text = await _local_complete()
            if not text:                            # local down -> Groq safety net
                text = await _groq_complete(msgs) or ""
        return {"id": cid, "object": "chat.completion", "created": created, "model": model,
                "choices": [{"index": 0,
                             "message": {"role": "assistant", "content": text},
                             "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 1, "completion_tokens": max(1, len(text.split())),
                          "total_tokens": max(2, len(text.split()) + 1)}}

    # ---- STREAM (hybrid: heavy->Groq first, casual->local first) ----
    omsgs = _mk_messages(_with_persona(msgs))

    def _chunk(piece):
        ch = {"id": cid, "object": "chat.completion.chunk", "created": created, "model": model,
              "choices": [{"index": 0, "delta": {"content": piece}, "finish_reason": None}]}
        return f"data: {_json.dumps(ch)}\n\n"

    async def _stream_groq():
        if not _live_groq_key():
            return
        async with httpx.AsyncClient(timeout=None) as c:
            async with c.stream("POST", _GROQ_URL, headers=_groq_headers(),
                                json=_groq_payload(msgs, True)) as r:
                if r.status_code != 200:
                    return
                async for line in r.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        obj = _json.loads(data)
                    except Exception:
                        continue
                    piece = (obj.get("choices") or [{}])[0].get("delta", {}).get("content", "")
                    if piece:
                        yield piece

    async def _stream_local():
        omodel = await _resolve_ollama_model()
        async with httpx.AsyncClient(timeout=None) as c:
            async with c.stream("POST", f"{OLLAMA_URL}/api/chat",
                                json={"model": omodel, "messages": omsgs,
                                      "stream": True, "keep_alive": -1}) as r:
                async for line in r.aiter_lines():
                    if not line:
                        continue
                    try:
                        obj = _json.loads(line)
                    except Exception:
                        continue
                    piece = (obj.get("message") or {}).get("content", "")
                    if piece:
                        yield piece
                    if obj.get("done"):
                        break

    async def gen():
        head = {"id": cid, "object": "chat.completion.chunk", "created": created, "model": model,
                "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}]}
        yield f"data: {_json.dumps(head)}\n\n"

        order = (_stream_groq, _stream_local) if _use_groq(model, msgs) else (_stream_local, _stream_groq)
        got_any = False
        for src in order:
            if got_any:
                break
            try:
                async for piece in src():
                    got_any = True
                    yield _chunk(piece)
            except Exception:
                pass
        if not got_any:
            yield _chunk("[EMPIRE is momentarily busy — please resend.]")

        tail = {"id": cid, "object": "chat.completion.chunk", "created": created, "model": model,
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]}
        yield f"data: {_json.dumps(tail)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
