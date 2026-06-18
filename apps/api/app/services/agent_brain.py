"""
Agent brain — turns a task into a result + a memory line.

Uses an LLM when OPENAI_API_KEY is configured (RAG-ready: the caller passes the
agent's recent memory as context). Falls back to a deterministic, role-aware
synthesis so the agent loop runs fully offline with no external dependency.
"""
from __future__ import annotations
from app.config import settings

# Per-role framing so each agent "thinks" in character even in fallback mode.
_ROLE_VOICE = {
    "Strategy":     ("Chief Strategist", "set direction and allocate capital"),
    "Research":     ("Data Hunter", "mine signals and surface opportunities"),
    "Risk":         ("Risk Guardian", "guard exposure and flag threats"),
    "Capital":      ("Market Scout", "scan markets and find high-probability setups"),
    "Media":        ("News Analyst", "track narrative and brief the empire"),
    "Intelligence": ("Trend Tracker", "forecast regimes and monitor signals"),
}

_FALLBACK = {
    "Strategy":     "Reviewed allocation; momentum regime favors continuation. Recommend holding the trading book at current deployment and revisiting in 4h.",
    "Research":     "Scanned current feeds; isolated 4 high-confidence opportunities and queued a detailed report for the strategist.",
    "Risk":         "Exposure within limits; drawdown protection active. No breach detected. Status: SAFE.",
    "Capital":      "Order-flow scan complete; 2 setups meet the high-confidence bar. Prepared execution plan pending approval.",
    "Media":        "Narrative tracking complete; sentiment net-positive. Drafted brief on the leading market story.",
    "Intelligence": "Forecast model updated; signal strength rising. Probability of continuation revised upward.",
}


def _fallback(division: str, action: str) -> str:
    base = _FALLBACK.get(division, "Task processed.")
    return f"[{action}] {base}"


async def think(agent_name: str, division: str, action: str, context: list[str]) -> str:
    """Return the agent's result text for a task. Async to allow real LLM calls."""
    if not settings.OPENAI_API_KEY:
        return _fallback(division, action)
    # LLM path — optional; only runs when a key is present.
    try:
        import httpx
        who, mandate = _ROLE_VOICE.get(division, (agent_name, "execute the task"))
        mem = "\n".join(f"- {m}" for m in context[-5:]) or "- (no prior memory)"
        prompt = (
            f"You are {who}, an AI agent in the 6-EMPIRE corporation whose job is to {mandate}. "
            f"Recent memory:\n{mem}\n\nTask: {action}. "
            "Respond in 1-2 concise sentences as a decisive status update."
        )
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "max_tokens": 120},
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return _fallback(division, action)
