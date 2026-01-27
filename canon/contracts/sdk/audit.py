#!/usr/bin/env python3
"""
Osiris Audit SDK - Unavoidable Emission
MUST be imported by all Python execution contexts.
"""

import json
import hashlib
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Literal
import os

CANON_ROOT = Path(os.getenv("CANON_ROOT", Path.home() / "mirrornode" / "canon"))
DOSSIERS = CANON_ROOT / "dossiers"
DOSSIERS.mkdir(parents=True, exist_ok=True)

Verdict = Literal["SUCCESS", "FAILURE", "BLOCKED", "ESCALATED"]

def get_repo_hash() -> str:
    """Get current git commit hash."""
    try:
        import subprocess
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], 
            stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        return "UNKNOWN"

def get_charter_hash(repo_name: str) -> str:
    """Get SHA256 of charter file, or UNCHARTERED."""
    charter_path = CANON_ROOT / "charters" / f"{repo_name.upper().replace('-', '_')}.md"
    
    if not charter_path.exists():
        return "UNCHARTERED"
    
    content = charter_path.read_bytes()
    return hashlib.sha256(content).hexdigest()

def emit_audit(
    repo: str,
    event_type: str,
    actor: str,
    verdict: Verdict,
    evidence: Dict[str, Any],
    charter_override: Optional[str] = None
) -> str:
    """
    Emit audit record. This function CANNOT be suppressed.
    
    Args:
        repo: Repository name
        event_type: execution|deployment|schema_change|agent_invocation
        actor: human|agent|system
        verdict: SUCCESS|FAILURE|BLOCKED|ESCALATED
        evidence: Dict containing inputs, outputs, duration_ms, error
        charter_override: Override charter hash (testing only)
    
    Returns:
        audit_id (UUID)
    
    Raises:
        RuntimeError: If audit emission fails (HALTS execution)
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    audit_id = str(uuid.uuid4())
    
    charter_hash = charter_override or get_charter_hash(repo)
    
    record = {
        "timestamp": timestamp,
        "repo": repo,
        "repo_hash": get_repo_hash(),
        "charter_hash": charter_hash,
        "event_type": event_type,
        "actor": actor,
        "verdict": verdict,
        "evidence": evidence,
        "audit_id": audit_id
    }
    
    # Determine output path
    year_month = datetime.now().strftime("%Y-%m")
    month_dir = DOSSIERS / year_month
    month_dir.mkdir(exist_ok=True)
    
    audit_file = month_dir / f"audit-{repo}-{timestamp.replace(':', '-')}.json"
    
    try:
        # Write to file (NDJSON format)
        with audit_file.open("a") as f:
            f.write(json.dumps(record) + "\n")
        
        # Also emit to stdout for streaming
        print(f"[AUDIT] {audit_id} | {repo} | {verdict}", flush=True)
        
        return audit_id
        
    except Exception as e:
        # CRITICAL: Audit failure MUST halt execution
        raise RuntimeError(
            f"AUDIT EMISSION FAILED - EXECUTION HALTED\n"
            f"Audit ID: {audit_id}\n"
            f"Repo: {repo}\n"
            f"Error: {e}\n"
            f"This is a constitutional violation."
        ) from e

def audit_execution(repo: str, actor: str = "system"):
    """
    Decorator for automatic audit emission around function execution.
    
    Usage:
        @audit_execution("mirrornode-py", actor="agent")
        def process_event(data):
            return {"result": "success"}
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = datetime.now()
            
            try:
                result = func(*args, **kwargs)
                duration_ms = (datetime.now() - start_time).total_seconds() * 1000
                
                emit_audit(
                    repo=repo,
                    event_type="execution",
                    actor=actor,
                    verdict="SUCCESS",
                    evidence={
                        "function": func.__name__,
                        "duration_ms": duration_ms,
                        "error": None
                    }
                )
                
                return result
                
            except Exception as e:
                duration_ms = (datetime.now() - start_time).total_seconds() * 1000
                
                emit_audit(
                    repo=repo,
                    event_type="execution",
                    actor=actor,
                    verdict="FAILURE",
                    evidence={
                        "function": func.__name__,
                        "duration_ms": duration_ms,
                        "error": str(e)
                    }
                )
                
                raise  # Re-raise after audit
                
        return wrapper
    return decorator

# Self-test on import
if __name__ == "__main__":
    # Verify audit emission works
    test_id = emit_audit(
        repo="osiris-audit",
        event_type="execution",
        actor="system",
        verdict="SUCCESS",
        evidence={"test": True, "duration_ms": 0, "error": None}
    )
    print(f"✓ Self-test passed: {test_id}")
