#!/usr/bin/env python3
"""
empire-free-llm MCP server — exposes the 19 free LLM providers as MCP tools.
Built per the mcp-builder guidance (Python/FastMCP, stdio transport, Pydantic
schemas, actionable errors, readOnly/openWorld annotations).

Tools:
  - list_free_providers()         : catalog of all 19 free LLM providers
  - list_active_providers()       : providers with a key set in the env
  - free_chat(prompt, provider?)  : run a chat via the fastest active free provider (or a named one)

Run:  python3 empire_free_mcp.py   (stdio)
Deps: pip install "mcp[cli]" httpx
"""
import os, json, asyncio, httpx
from pathlib import Path
from typing import Optional

try:
    from mcp.server.fastmcp import FastMCP
except Exception as e:  # graceful message if SDK missing
    raise SystemExit("Install the MCP SDK first:  pip install 'mcp[cli]' httpx") from e

CATALOG = Path(__file__).with_name("free_llm_providers.json")
mcp = FastMCP("empire-free-llm")


def _catalog():
    try:
        return json.loads(CATALOG.read_text())["providers"]
    except Exception:
        return []


def _active():
    out = [{**p, "key": os.getenv(p["env_key"])} for p in _catalog() if os.getenv(p["env_key"])]
    out.sort(key=lambda x: x.get("priority", 99))
    return out


@mcp.tool(annotations={"readOnlyHint": True, "openWorldHint": False})
def list_free_providers() -> str:
    """List all free LLM providers EMPIRE knows about (name, base URL, models, env var to set)."""
    rows = [{"name": p["name"], "env_key": p["env_key"], "base_url": p["base_url"],
             "models": p.get("models", [])[:5], "priority": p.get("priority")}
            for p in _catalog()]
    return json.dumps({"count": len(rows), "providers": rows}, indent=2)


@mcp.tool(annotations={"readOnlyHint": True, "openWorldHint": False})
def list_active_providers() -> str:
    """List free providers that currently have an API key set (ready to use)."""
    act = [{"name": p["name"], "base_url": p["base_url"]} for p in _active()]
    if not act:
        return json.dumps({"active": 0, "hint": "Set a key, e.g. FREE_GROQ_KEY=gsk_..., then restart."})
    return json.dumps({"active": len(act), "providers": act}, indent=2)


@mcp.tool(annotations={"readOnlyHint": False, "openWorldHint": True})
async def free_chat(prompt: str, provider: Optional[str] = None, max_tokens: int = 512) -> str:
    """Run a chat completion through a free LLM provider.
    If `provider` is omitted, uses the fastest active provider (Groq > Cerebras > ...).
    Returns the assistant's reply, or an actionable error if no provider is active."""
    pool = _active()
    if not pool:
        return ("No free provider is active. Add a key (e.g. FREE_GROQ_KEY) and restart. "
                "Get one free at https://console.groq.com/keys")
    if provider:
        pool = [p for p in pool if p["name"].lower() == provider.lower()] or pool
    last = {}
    for p in pool:
        try:
            mdl = p["models"][0] if p.get("models") else "default"
            async with httpx.AsyncClient(timeout=30) as c:
                r = await c.post(f"{p['base_url'].rstrip('/')}/chat/completions",
                                 headers={"Authorization": f"Bearer {p['key']}",
                                          "Content-Type": "application/json"},
                                 json={"model": mdl, "messages": [{"role": "user", "content": prompt}],
                                       "max_tokens": max_tokens})
                r.raise_for_status()
                return f"[{p['name']}] " + r.json()["choices"][0]["message"]["content"]
        except Exception as e:
            last[p["name"]] = type(e).__name__
    return f"All active providers failed: {json.dumps(last)}"


if __name__ == "__main__":
    mcp.run()
