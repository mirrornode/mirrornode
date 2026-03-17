from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import date
from pathlib import Path

app = FastAPI(title="MirrorNode Spine API")

BASE = Path(__file__).resolve().parents[2]

@app.get("/logs/today")
def get_logs_today():
    path = BASE / f"logs/changes/{date.today().isoformat()}.md"
    return {"date": str(date.today()), "content": path.read_text() if path.exists() else ""}

@app.get("/checklist/today")
def get_checklist_today():
    path = BASE / "checklists/today.md"
    return {"content": path.read_text() if path.exists() else ""}

@app.get("/projects")
def get_projects():
    path = BASE / "canon/agents"
    agents = [f.stem for f in path.glob("*.json")] if path.exists() else []
    return {"agents": agents}

@app.get("/canon/decisions")
def get_decisions():
    path = BASE / "canon/charters"
    files = [f.name for f in path.glob("*.md")] if path.exists() else []
    return {"decisions": files}
