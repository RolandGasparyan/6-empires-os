"""
Lightweight Prometheus-format metrics (no external dependency).
Counts HTTP requests by method/status and exposes agent + uptime gauges.
"""
import time
from collections import defaultdict

_start = time.time()
_http_requests: dict[tuple[str, int], int] = defaultdict(int)
_http_errors = 0


def record_request(method: str, status: int) -> None:
    global _http_errors
    _http_requests[(method, status)] += 1
    if status >= 500:
        _http_errors += 1


def render() -> str:
    from app.services import agent_state
    lines: list[str] = []
    lines.append("# HELP empire_uptime_seconds Process uptime in seconds.")
    lines.append("# TYPE empire_uptime_seconds gauge")
    lines.append(f"empire_uptime_seconds {time.time() - _start:.0f}")

    lines.append("# HELP empire_http_requests_total HTTP requests by method and status.")
    lines.append("# TYPE empire_http_requests_total counter")
    for (method, status), n in sorted(_http_requests.items()):
        lines.append(f'empire_http_requests_total{{method="{method}",status="{status}"}} {n}')

    lines.append("# HELP empire_http_errors_total 5xx responses.")
    lines.append("# TYPE empire_http_errors_total counter")
    lines.append(f"empire_http_errors_total {_http_errors}")

    # agent gauges
    try:
        agents = agent_state.snapshot()
        lines.append("# HELP empire_agents_total Number of agents.")
        lines.append("# TYPE empire_agents_total gauge")
        lines.append(f"empire_agents_total {len(agents)}")
        lines.append("# HELP empire_agent_tasks_total Tasks per agent.")
        lines.append("# TYPE empire_agent_tasks_total gauge")
        for a in agents:
            n = len(agent_state.tasks_for(a["key"]))
            lines.append(f'empire_agent_tasks_total{{agent="{a["key"]}"}} {n}')
    except Exception:
        pass
    return "\n".join(lines) + "\n"
