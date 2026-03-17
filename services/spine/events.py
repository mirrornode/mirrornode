from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import hashlib, json

router = APIRouter()

class Event(BaseModel):
    source: str
    event_type: str
    payload: dict

@router.post("/events/log")
def log_event(event: Event):
    entry = {
        "time": datetime.utcnow().isoformat() + "Z",
        "source": event.source,
        "event_type": event.event_type,
        "payload": event.payload
    }
    sha = hashlib.sha256(json.dumps(entry).encode()).hexdigest()
    print(f"CANON EVENT: {json.dumps(entry)}")  # Vercel runtime logs
    return {"status": "logged", "sha256": sha, "entry": entry}

@router.get("/events/today")
def get_events_today():
    return {"events": [], "note": "persistent storage coming soon"}
