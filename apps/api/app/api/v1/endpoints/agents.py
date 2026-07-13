from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.security.deps import get_current_user, require_cookie_origin, require_founder
from app.services import agent_state
from app.services.agent_repo import AgentRepositoryError

router = APIRouter(prefix="/agents", tags=["agents"])


class CommandBody(BaseModel):
    title: str = Field(min_length=1, max_length=2_000)


@router.get("")
async def list_agents():
    agents = agent_state.snapshot()
    return {"total": len(agents), "agents": agents}


@router.get("/{agent_id}/tasks")
async def agent_tasks(agent_id: str, _=Depends(get_current_user)):
    if not agent_state.get_agent(agent_id):
        raise HTTPException(404, "Unknown agent")
    return {"agent": agent_id, "tasks": agent_state.tasks_for(agent_id)}


@router.get("/{agent_id}/memory")
async def agent_memory(agent_id: str, _=Depends(get_current_user)):
    if not agent_state.get_agent(agent_id):
        raise HTTPException(404, "Unknown agent")
    return {"agent": agent_id, "memory": agent_state.memory_for(agent_id)}


@router.post("/{agent_id}/command")
async def command_agent(
    agent_id: str,
    body: CommandBody,
    _=Depends(require_founder),
    __=Depends(require_cookie_origin),
):
    try:
        task = await agent_state.enqueue_task(agent_id, body.title)
    except AgentRepositoryError as exc:
        raise HTTPException(503, "Task could not be durably queued") from exc
    if task is None:
        raise HTTPException(404, "Unknown agent")
    return {"accepted": True, "task": task}
