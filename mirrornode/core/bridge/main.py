from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
import logging
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from mirrornode.core.events.schema import MirrorNodeEvent
from mirrornode.core.events.validator import validate_event
from mirrornode.core.bridge.router import EventRouter
from mirrornode.core.adapters.claude import ClaudeAdapter
from mirrornode.core.adapters.theia import TheiaAdapter
from mirrornode.core.adapters.grok import GrokAdapter
from mirrornode.core.adapters.gpt import GptAdapter

# Router instance
router = EventRouter(max_recent=100)
router.register_adapter(ClaudeAdapter())
router.register_adapter(TheiaAdapter())
router.register_adapter(GrokAdapter())
router.register_adapter(GptAdapter())

# FastAPI application
app = FastAPI(title="MIRRORNODE Bridge", version="1.0.0")

logger = logging.getLogger("mirrornode.bridge")
logging.basicConfig(level=logging.INFO)

# Oracle Request/Response Models
class OracleRequest(BaseModel):
    sessionId: str
    mode: Literal["oracle", "story", "decision", "shadow"]
    prompt: str
    ritualState: Literal["invoked", "open", "close"]
    context: Optional[Dict[str, Any]] = None

class OracleResponse(BaseModel):
    text: str
    traceId: str
    audioUrl: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@app.get("/health")
async def health():
    """
    Health check endpoint.
    """
    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "adapters": ["claude", "theia", "grok", "gpt"]
    }

@app.post("/oracle", response_model=OracleResponse)
async def oracle(request: OracleRequest):
    """
    Oracle invocation endpoint for Mirror Mirror.
    Accepts session, mode, prompt, and ritual state.
    Returns oracle response with trace ID.
    """
    trace_id = str(uuid.uuid4())
    
    # Stub response - will be replaced with actual oracle logic
    response_text = f"[ORACLE STUB - {request.mode.upper()}] {request.prompt}"
    
    return OracleResponse(
        text=response_text,
        traceId=trace_id,
        audioUrl=None,
        metadata={
            "mode": request.mode,
            "ritualState": request.ritualState,
            "sessionId": request.sessionId
        }
    )

@app.post("/event")
async def post_event(event: MirrorNodeEvent):
    """
    Accepts incoming MirrorNodeEvent,
    validates it, and routes through MIRRORNODE.
    """
    valid, msg = validate_event(event)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    event.ensure_metadata()
    await router.route(event)

    return JSONResponse({"status": "routed"})

@app.get("/events/recent", response_model=List[dict])
async def get_recent_events():
    """
    Returns recent events routed through MIRRORNODE.
    """
    return [jsonable_encoder(e) for e in router.recent_events]

@app.websocket("/stream")
async def websocket_stream(ws: WebSocket):
    """
    Live WebSocket stream of events moving through the system.
    """
    await ws.accept()
    try:
        async for event in router.subscribe():
            await ws.send_json({"type": "event", "event": 
jsonable_encoder(event)})
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as exc:
        logger.exception("WebSocket stream error: %s", exc)
        await ws.close(code=1011)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("mirrornode.core.bridge.main:app", 
host="0.0.0.0", port=8000, log_level="info")

