from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.security.deps import require_founder
from app.services import agent_state

router = APIRouter(prefix="/agents", tags=["agents"])


class CommandBody(BaseModel):
    title: str


@router.get("")
async def list_agents():
    agents = agent_state.snapshot()
    return {"total": len(agents), "agents": agents}


@router.get("/{agent_id}/tasks")
async def agent_tasks(agent_id: str):
    if not agent_state.get_agent(agent_id):
        raise HTTPException(404, "Unknown agent")
    return {"agent": agent_id, "tasks": agent_state.tasks_for(agent_id)}


@router.get("/{agent_id}/memory")
async def agent_memory(agent_id: str):
    if not agent_state.get_agent(agent_id):
        raise HTTPException(404, "Unknown agent")
    return {"agent": agent_id, "memory": agent_state.memory_for(agent_id)}


@router.post("/{agent_id}/command")
async def command_agent(agent_id: str, body: CommandBody, _=Depends(require_founder)):
    task = agent_state.enqueue_task(agent_id, body.title)
    if task is None:
        raise HTTPException(404, "Unknown agent")
    return {"accepted": True, "task": task}
