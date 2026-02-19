from __future__ import annotations
from pathlib import Path
from datetime import datetime
import json

ICONS = {"pass": "✅", "fail": "❌", "warn": "⚠️"}

def _gate_table(checks: list) -> str:
    rows = ["| Gate | Status | Detail |",
            "|------|--------|--------|"]
    for c in checks:
        icon = "✅" if c["ok"] else "❌"
        detail = ""
        if not c["ok"] and "error" in c:
            detail = f"`{c['error'][:80]}`"
        elif c["ok"] and c.get("detail"):
            d = c["detail"]
            if isinstance(d, dict):
                detail = ", ".join(f"`{k}`" for k in list(d.keys())[:4])
            else:
                detail = str(d)[:80]
        rows.append(f"| `{c['id']}` | {icon} | {detail} |")
    return "\n".join(rows)

def _next_actions(checks: list) -> str:
    actions = []
    for c in checks:
        if not c["ok"]:
            err = c.get("error", "unknown error")
            if "MISSING" in err or "not set" in err:
                actions.append(f"- Set missing API key for `{c['id']}` in `.env`")
            elif "import" in err.lower():
                actions.append(f"- Fix import error in `{c['id']}`: {err[:60]}")
            else:
                actions.append(f"- Investigate `{c['id']}`: {err[:60]}")
    if not actions:
        actions.append("- All gates green — proceed to next move")
    return "\n".join(actions)

def write_mirror(result: dict, run_dir: Path) -> Path:
    status = result["final_status"]
    icon = ICONS.get(status, "⚠️")
    ts = result.get("started_at", datetime.utcnow().isoformat())
    duration = result.get("duration_ms", 0)
    checks = result.get("checks", [])
    passed = sum(1 for c in checks if c["ok"])
    total = len(checks)

    bridge = next((c for c in checks if c["id"] == "bridge_health"), {})
    adapters = []
    if bridge.get("ok") and isinstance(bridge.get("detail"), dict):
        adapters = bridge["detail"].get("adapters", [])

    md = f"""# 🪞 Mirror Report

> **{icon} {status.upper()}** — {passed}/{total} gates passed · {duration}ms · `{result['run_id']}`

---

## System Gates

{_gate_table(checks)}

---

## Bridge Status

| Field | Value |
|-------|-------|
| Health | {"✅ operational" if bridge.get("ok") else "❌ offline"} |
| Adapters | {", ".join(f"`{a}`" for a in adapters) if adapters else "—"} |
| Security | `{bridge.get("detail", {}).get("security", "—") if isinstance(bridge.get("detail"), dict) else "—"}` |

---

## Next Actions

{_next_actions(checks)}

---

*Generated {ts} · Osiris Sweep v0.1 · mirrornode*
"""

    path = run_dir / "mirror.md"
    path.write_text(md.strip(), encoding="utf-8")
    return path
