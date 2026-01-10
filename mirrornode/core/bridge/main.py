"""
MIRRORNODE Bridge - FastAPI Application
NOW WITH: API Key Auth + Rate Limiting + CORS

Authority: THOTH Security Commander
Date: 2025-01-09
Status: LOCKDOWN PASS ACTIVE
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
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
from mirrornode.core.bridge.security import require_api_key, get_api_key
from mirrornode.core.bridge.schemas import AuditRequest, AuditResponse

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],  # Global default: 60 requests/minute
    storage_uri="memory://",
)

# Router instance
router = EventRouter(history_size=100)
router.register_adapter("claude", ClaudeAdapter())
router.register_adapter("theia", TheiaAdapter())
router.register_adapter("grok", GrokAdapter())
router.register_adapter("gpt", GptAdapter())

# FastAPI application
app = FastAPI(
    title="MIRRORNODE Bridge",
    version="1.0.0",
    description="Event-driven Oracle coordination layer with security"
)

# Attach limiter to app state
app.state.limiter = limiter

# Register rate limit exception handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Osiris HUD dev
    "http://localhost:5173",  # Vite dev server
    "http://localhost:8000",  # FastAPI itself (for testing)
    # Add production domains when deployed:
    # "https://osiris-hud.vercel.app",
    # "https://mirrornode.ai",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
    allow_credentials=False,  # No cookies needed
    max_age=3600,  # Cache preflight for 1 hour
)

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

# ============================================================
# PUBLIC ENDPOINTS (No authentication required)
# ============================================================

@app.get("/health")
async def health():
    """
    Public health check endpoint.
    No authentication required for operational monitoring.
    """
    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "security": "lockdown_active",
        "adapters": ["claude", "theia", "grok", "gpt"]
    }

# ============================================================
# SECURED ENDPOINTS (API key required)
# ============================================================

@app.post(
    "/oracle",
    response_model=OracleResponse,
    dependencies=[Depends(require_api_key)],
    tags=["oracle"]
)
@limiter.limit("10/minute")  # Very strict for Oracle invocations
async def oracle(request: Request, oracle_request: OracleRequest):
    """
    Oracle invocation endpoint for Mirror Mirror.
    
    Security:
        - Requires X-API-Key header
        - Rate limit: 10 requests/minute
    
    Args:
        oracle_request: Oracle invocation parameters
    
    Returns:
        OracleResponse with text, trace ID, and metadata
    """
    trace_id = str(uuid.uuid4())
    
    logger.info(f"Oracle invoked: mode={oracle_request.mode}, session={oracle_request.sessionId}")
    
    # Stub response - will be replaced with actual oracle logic
    response_text = f"[ORACLE STUB - {oracle_request.mode.upper()}] {oracle_request.prompt}"
    
    return OracleResponse(
        text=response_text,
        traceId=trace_id,
        audioUrl=None,
        metadata={
            "mode": oracle_request.mode,
            "ritualState": oracle_request.ritualState,
            "sessionId": oracle_request.sessionId
        }
    )

@app.post(
    "/event",
    dependencies=[Depends(require_api_key)],
    tags=["events"]
)
@limiter.limit("30/minute")  # Stricter than default for event submission
async def post_event(request: Request, event: MirrorNodeEvent):
    """
    Submit event to MIRRORNODE event router.
    
    Security:
        - Requires X-API-Key header
        - Rate limit: 30 requests/minute
    
    Args:
        event: MirrorNodeEvent to route
    
    Returns:
        JSON with status="routed"
    """
    valid, msg = validate_event(event)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    event.ensure_metadata()
    await router.route(event)
    
    logger.info(f"Event routed: type={event.event_type}, node={event.node}")

    return JSONResponse({"status": "routed"})

@app.get(
    "/events/recent",
    response_model=List[dict],
    dependencies=[Depends(require_api_key)],
    tags=["events"]
)
@limiter.limit("60/minute")
async def get_recent_events(request: Request):
    """
    Retrieve recent events routed through MIRRORNODE.
    
    Security:
        - Requires X-API-Key header
        - Rate limit: 60 requests/minute
    
    Returns:
        List of recent events (last 100)
    """
    return [jsonable_encoder(e) for e in router.history]

@app.post(
    "/audit",
    response_model=AuditResponse,
    dependencies=[Depends(require_api_key)],
    tags=["osiris"]
)
@limiter.limit("20/minute")  # Moderate limit for audit jobs
async def submit_audit(request: Request, audit: AuditRequest):
    """
    Submit audit job from Osiris HUD.
    
    Security:
        - Requires X-API-Key header
        - Rate limit: 20 requests/minute
        - Validates pipeline_config size (max 10KB)
    
    Args:
        audit: AuditRequest with trace_id, event, pipeline_config
    
    Returns:
        AuditResponse with trace_id and status
    """
    logger.info(f"Audit submitted: event={audit.event}, trace_id={audit.trace_id}")
    
    # Create MirrorNodeEvent from audit request
    mirror_event = MirrorNodeEvent(
        event_type="ANALYSIS",
        node="osiris",
        source={
            "node": "osiris-hud",
            "surface": "web",
            "origin": request.client.host if request.client else "unknown"
        },
        payload={
            "audit_event": audit.event,
            "pipeline_config": audit.pipeline_config
        },
        trace_id=str(audit.trace_id)
    )
    
    # Route through event system
    await router.dispatch(mirror_event)
    
    return AuditResponse(
        trace_id=audit.trace_id,
        status="queued",
        timestamp=datetime.utcnow().isoformat(),
        message="Audit job queued for processing"
    )

@app.websocket("/stream")
async def websocket_stream(ws: WebSocket):
    """
    Live WebSocket stream of events moving through the system.
    
    Security:
        - Expects API key in first message: {"api_key": "..."}
        - Closes connection if invalid key
    
    Protocol:
        1. Client connects
        2. Server accepts connection
        3. Client sends: {"api_key": "mnk_live_..."}
        4. Server validates key
        5. Server streams events as JSON
    """
    await ws.accept()
    
    try:
        # Expect API key in first message
        auth_msg = await ws.receive_json()
        api_key = auth_msg.get("api_key")
        
        # Validate API key
        expected_key = get_api_key()
        if not api_key or api_key != expected_key:
            await ws.send_json({
                "error": "Invalid API key",
                "code": 401,
                "detail": "WebSocket authentication failed"
            })
            await ws.close(code=1008)  # Policy violation
            logger.warning(f"WebSocket auth failed from {ws.client}")
            return
        
        logger.info(f"WebSocket authenticated from {ws.client}")
        
        # Stream events
        async for event in router.subscribe():
            await ws.send_json({
                "type": "event",
                "event": jsonable_encoder(event)
            })
            
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as exc:
        logger.exception("WebSocket stream error: %s", exc)
        await ws.close(code=1011)  # Internal error

# ============================================================
# APPLICATION STARTUP
# ============================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("🔒 THOTH Security Commander: FastAPI lockdown active")
    logger.info("📡 Starting MIRRORNODE Bridge with authentication enabled")
    uvicorn.run(
        "mirrornode.core.bridge.main:app",
        host="127.0.0.1",
        port=8000,
        log_level="info",
        reload=True  # Enable hot reload for development
    )
