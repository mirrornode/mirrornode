from __future__ import annotations
from datetime import datetime, timezone
from uuid import uuid4

def new_run_id() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return f"run_{ts}_{uuid4().hex[:6]}"

def new_correlation_id() -> str:
    return f"corr_{uuid4().hex}"
