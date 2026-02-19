from __future__ import annotations
from mirrornode.mirror import write_mirror
import json, os, time, subprocess, sys
from datetime import datetime
from pathlib import Path
import urllib.request

def _ts_dir() -> str:
    return datetime.utcnow().strftime("%Y%m%d_%H%M%S")

def _http_json(url: str, timeout_s: float = 3.0):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout_s) as r:
        return json.loads(r.read().decode("utf-8"))

def _check(result: dict, id: str, ok: bool, detail=None, error=None):
    entry = {"id": id, "ok": ok}
    if detail is not None: entry["detail"] = detail
    if error is not None: entry["error"] = error
    result["checks"].append(entry)
    if not ok:
        result["final_status"] = "fail"

def run_sweep(args) -> int:
    out_root = Path(args.out)
    run_dir = out_root / f"sweep_{_ts_dir()}"
    run_dir.mkdir(parents=True, exist_ok=True)

    started = time.time()
    result = {
        "run_id": run_dir.name,
        "started_at": datetime.utcnow().isoformat() + "Z",
        "checks": [],
        "final_status": "pass",
    }

    # GATE 01: Bridge health
    try:
        health = _http_json("http://127.0.0.1:8000/health")
        ok = health.get("status") == "operational"
        _check(result, "bridge_health", ok, detail=health)
    except Exception as e:
        _check(result, "bridge_health", False, error=str(e))

    # GATE 02: Canon loader
    try:
        from mirrornode.core.prompt_loader import load_prompt
        prompts = {"merlin": load_prompt("merlin")}
        ok = isinstance(prompts, dict) and len(prompts) > 0
        _check(result, "canon_loader", ok, detail={"keys": list(prompts.keys())})
    except Exception as e:
        _check(result, "canon_loader", False, error=str(e))

    # GATE 03: Credential verify
    try:
        from mirrornode.core.credential_verify import check_all as verify_credentials
        cred_result = verify_credentials()
        ok = cred_result.get("all_ok", False) if isinstance(cred_result, dict) else bool(cred_result)
        _check(result, "credential_verify", ok, detail=cred_result if isinstance(cred_result, dict) else {"raw": str(cred_result)})
    except Exception as e:
        _check(result, "credential_verify", False, error=str(e))

    # GATE 04: Tests
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "-q",
             "tests/test_agents.py", "tests/test_merlin_flow.py",
             "--tb=short", "--no-header"],
            capture_output=True, text=True, cwd=Path(__file__).parent.parent
        )
        ok = proc.returncode == 0
        _check(result, "tests", ok, detail={
            "returncode": proc.returncode,
            "stdout": proc.stdout[-1000:],
            "stderr": proc.stderr[-500:]
        })
    except Exception as e:
        _check(result, "tests", False, error=str(e))

    result["duration_ms"] = int((time.time() - started) * 1000)

    # Write artifacts
    (run_dir / "sweep.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    write_mirror(result, run_dir)

    # Print summary to terminal
    print(f"\n{'='*48}")
    print(f"  OSIRIS SWEEP — {result['final_status'].upper()}  [{result['duration_ms']}ms]")
    print(f"{'='*48}")
    for c in result["checks"]:
        icon = "✅" if c["ok"] else "❌"
        print(f"  {icon}  {c['id']}")
    print(f"\n  artifacts → {run_dir}/\n")

    return 0 if result["final_status"] == "pass" else 30
