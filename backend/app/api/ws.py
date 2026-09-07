import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from app.services.orchestrator import orchestrator
from app.models.schemas import RiskProfileType

router = APIRouter(tags=["Real-Time Orchestrator Streams"])

@router.websocket("/ws/orchestrator/{job_id}")
async def websocket_orchestrator_endpoint(websocket: WebSocket, job_id: str):
    """
    Bi-directional WebSocket for real-time 17-step operational execution updates.
    """
    await websocket.accept()

    # Callback to push updates down the websocket
    async def listener_callback(payload: dict):
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception:
            pass

    orchestrator.subscribe(job_id, listener_callback)

    # If job already has state, push initial snapshot
    if job_id in orchestrator.jobs:
        job = orchestrator.jobs[job_id]
        await websocket.send_text(json.dumps({
            "job_id": job_id,
            "contract_id": job.contract_id,
            "step": job.current_step,
            "description": job.step_description,
            "progress": job.progress_percentage,
            "status": job.status,
            "data": {
                "entities_count": len(job.entities),
                "clauses_count": len(job.clauses),
                "risk_summary": job.risk_summary.model_dump() if job.risk_summary else None
            }
        }))

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                action = msg.get("action")
                
                if action == "SWITCH_PROFILE":
                    profile_str = msg.get("profile", "Vendor Standard")
                    try:
                        profile = RiskProfileType(profile_str)
                    except ValueError:
                        profile = RiskProfileType.VENDOR_STANDARD
                    await orchestrator.evaluate_risk_profile(job_id, profile)

                elif action == "FINALIZE":
                    actor = msg.get("actor", "Lead Legal Counsel")
                    await orchestrator.finalize_review(job_id, actor_name=actor)
                    
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        orchestrator.unsubscribe(job_id, listener_callback)

@router.get("/api/analysis/stream/{job_id}")
async def sse_analysis_stream(job_id: str):
    """
    Server-Sent Events (SSE) stream fallback for real-time progress events.
    """
    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        async def sse_callback(payload: dict):
            await queue.put(payload)

        orchestrator.subscribe(job_id, sse_callback)

        try:
            # Emit current snapshot
            if job_id in orchestrator.jobs:
                job = orchestrator.jobs[job_id]
                yield f"data: {json.dumps({'step': job.current_step, 'description': job.step_description, 'progress': job.progress_percentage})}\n\n"

            while True:
                payload = await queue.get()
                yield f"data: {json.dumps(payload)}\n\n"
                if payload.get("step") == 17:
                    break
        except asyncio.CancelledError:
            pass
        finally:
            orchestrator.unsubscribe(job_id, sse_callback)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
