from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, date
from pathlib import Path
import json
import hashlib

router = APIRouter()

BASE = Path(__file__).resolve().parents[2]

class Event(BaseModel):
    source: str        # e.g. "nexus-prime" or "osiris-pay"
    event_type: str    # e.g. "deploy", "payment", "audit"
    payload: dict

def append_log(entry: dict):
    log_path = BASE / f"logs/changes/{date.today().isoformat()}.md"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "a") as f:
        f.write(f"\n## {entry['time']} — {entry['source']} / {entry['event_type']}\n")
        f.write(f"```json\n{json.dumps(entry['payload'], indent=2)}\n```\n")

def write_canon_event(entry: dict):
    canon_path = BASE / f"canon/events/{date.today().isoformat()}.json"
    canon_path.parent.mkdir(parents=True, exist_ok=True)
    events = []
    if canon_path.exists():
        events = json.loads(canon_path.read_text())
    events.append(entry)
    canon_path.write_text(json.dumps(events, indent=2))
    return hashlib.sha256(canon_path.read_bytes()).hexdigest()

@router.post("/events/log")
def log_event(event: Event):
    entry = {
        "time": datetime.utcnow().isoformat() + "Z",
        "source": event.source,
        "event_type": event.event_type,
        "payload": event.payload
    }
    append_log(entry)
    hash = write_canon_event(entry)
    return {"status": "logged", "sha256": hash, "entry": entry}

@router.get("/events/today")
def get_events_today():
    canon_path = BASE / f"canon/events/{date.today().isoformat()}.json"
    if not canon_path.exists():
        return {"events": []}
    return {"events": json.loads(canon_path.read_text())}
