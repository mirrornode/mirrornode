import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import date
from pathlib import Path
import json

app = FastAPI()

BASE = Path(__file__).resolve().parents[2]

from services.spine.events import router as events_router
app.include_router(events_router)

@app.get("/")
def root():
    return {"status": "mirrornode spine online", "base": str(BASE)}

@app.get("/projects")
def get_projects():
    path = BASE / "canon/agents"
    if not path.exists():
        return {"agents": [], "debug": f"path not found: {path}"}
    agents = []
    for f in path.glob("*.json"):
        try:
            agents.append(json.loads(f.read_text()))
        except Exception as e:
            agents.append({"id": f.stem, "error": str(e)})
    return {"agents": agents}

@app.get("/canon/decisions")
def get_decisions():
    path = BASE / "canon/charters"
    files = [f.name for f in path.glob("*.md")] if path.exists() else []
    return {"decisions": files}

@app.get("/checklist/today")
def get_checklist_today():
    path = BASE / "checklists/today.md"
    return {"content": path.read_text() if path.exists() else ""}

@app.get("/logs/today")
def get_logs_today():
    path = BASE / f"logs/changes/{date.today().isoformat()}.md"
    return {"date": date.today().isoformat(), "content": path.read_text() if path.exists() else ""}
