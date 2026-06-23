"""
free_providers.py — EMPIRE free-LLM-API integration layer.

Reads free_llm_providers.json + environment keys, and exposes any provider that
has a key set as an OpenAI-compatible upstream. Drop this into the router
(apps/api) and import register_free_providers(). Fast providers (Groq, Cerebras,
SambaNova, Gemini) are tried first — they make EMPIRE near-instant vs the local
CPU model.

Add a key by setting its env var (see FREE_*_KEY names in the catalog), e.g.:
    FREE_GROQ_KEY=gsk_...
    FREE_CEREBRAS_KEY=csk-...
    FREE_GOOGLE_GEMINI_KEY=AIza...
Restart the router; the provider auto-activates. No code change needed.
"""
import os, json, time, httpx
from pathlib import Path

_CATALOG = Path(__file__).with_name("free_llm_providers.json")


def load_catalog():
    try:
        return json.loads(_CATALOG.read_text())["providers"]
    except Exception:
        return []


def active_providers():
    """Return catalog providers that have an API key present in the environment, priority-sorted."""
    out = []
    for p in load_catalog():
        key = os.getenv(p["env_key"])
        if key:
            out.append({**p, "key": key})
    out.sort(key=lambda x: x.get("priority", 99))
    return out


async def call_free(provider, messages, model=None, max_tokens=512, timeout=30):
    """OpenAI-compatible chat call to a free provider. Returns text or raises."""
    base = provider["base_url"].rstrip("/")
    mdl = model or (provider["models"][0] if provider.get("models") else "default")
    headers = {"Authorization": f"Bearer {provider['key']}", "Content-Type": "application/json"}
    # Google Gemini uses a different path/format; handle the common OpenAI-compat case here.
    url = f"{base}/chat/completions"
    async with httpx.AsyncClient(timeout=timeout) as c:
        r = await c.post(url, headers=headers,
                         json={"model": mdl, "messages": messages, "max_tokens": max_tokens})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


async def try_free_chain(messages, **kw):
    """Try each active free provider in priority order; return first success.
    Use this as the router's cloud-failover before/after local Ollama."""
    errors = {}
    for p in active_providers():
        try:
            text = await call_free(p, messages, **kw)
            return {"provider": p["name"], "base_url": p["base_url"], "response": text}
        except Exception as e:
            errors[p["name"]] = type(e).__name__
            continue
    return {"provider": None, "response": None, "errors": errors}


if __name__ == "__main__":
    cat = load_catalog()
    act = active_providers()
    print(f"Catalog: {len(cat)} free providers.")
    print(f"Active (key present): {len(act)}")
    for p in act:
        print(f"  ✓ {p['name']:22} {p['base_url']}")
    if not act:
        print("\nNo keys set yet. Add a key, e.g. export FREE_GROQ_KEY=gsk_... then re-run.")
        print("Fastest free picks: Groq, Cerebras, SambaNova, Google Gemini.")
