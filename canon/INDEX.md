cd ~/mirrornode

# Create INDEX.md
cat > canon/INDEX.md <<'EOINDEX'
# MIRRORNODE Canon - Master Index

**Status:** Operational  
**Last Updated:** 2025-01-27  
**Authority:** Desktop Commander + Oracle

---

## What This Is

Constitutional governance infrastructure for MIRRORNODE.

Every repo has declared boundaries.  
Every execution emits audits.  
Every charter is signed and locked.

This is not aspirational documentation - this is **enforced reality**.

---

## Directory Structure
```
canon/
├── README.md              # Overview
├── INDEX.md              # This file - navigation
│
├── charters/             # Constitutional authority
│   ├── LUCIAN_PRIME.md
│   ├── OSIRIS.md
│   ├── CORE_HUB.md
│   ├── INFRA.md
│   └── MIRRORNODE_PY.md
│
├── contracts/            # Technical specifications
│   ├── AUDIT_EMISSION.md
│   └── sdk/
│       ├── audit.py      # Python audit SDK
│       └── audit.ts      # TypeScript audit SDK
│
├── scripts/              # Executable tools
│   ├── bootstrap.sh      # Initialize canon structure
│   ├── charter_lucian.sh # Lock Lucian charter
│   ├── audit.sh          # Audit external repos
│   ├── index.sh          # Index GitHub org
│   ├── halt.sh           # Emergency stop
│   └── enforce_audits.sh # Check compliance
│
├── dossiers/             # Audit records (auto-generated)
│   └── YYYY-MM/
│       └── audit-{repo}-{timestamp}.json
│
└── index/                # System maps
    └── github-{org}.json
```

---

## Quick Reference

### Bootstrap New System
```bash
./canon/scripts/bootstrap.sh
./canon/scripts/charter_lucian.sh
```

### Daily Operations
```bash
make audit-check          # Check compliance (warnings only)
make audit-strict         # Check compliance (fail on violations)
make audit-test           # Test audit SDK
make charters             # List all active charters
```

### Audit External Repo
```bash
./canon/scripts/audit.sh https://github.com/org/repo
```

### Emergency Stop
```bash
./canon/scripts/halt.sh
```

---

## Integration Guide

### Python Projects
```python
from canon.contracts.sdk.audit import emit_audit, audit_execution

# Manual emission
audit_id = emit_audit(
    repo="your-repo",
    event_type="execution",
    actor="system",
    verdict="SUCCESS",
    evidence={"duration_ms": 123, "error": None}
)

# Decorator (automatic)
@audit_execution("your-repo", actor="agent")
def process_data(data):
    return {"result": "success"}
```

### TypeScript Projects
```typescript
import { emitAudit, auditExecution } from '@/canon/contracts/sdk/audit';

// Manual emission
const auditId = emitAudit({
  repo: 'your-repo',
  event_type: 'execution',
  actor: 'system',
  verdict: 'SUCCESS',
  evidence: { duration_ms: 123, error: null }
});
```

---

## Governance Principles

1. **Declared State = Observable Reality**
   - What charters say MUST match what code does
   - Audits prove alignment or surface drift

2. **Authority is Traceable**
   - Every decision references a charter
   - Every execution emits an audit
   - No silent changes

3. **Reversibility is Built In**
   - Clean git history
   - Signed charters
   - Immutable audit trail
   - halt.sh exists

4. **Constitutional Violations are Visible**
   - Unchartered repos flagged
   - Failed executions logged
   - Blocked operations recorded

---

## Support

- **Canon Issues:** File in mirrornode/mirrornode repo
- **Charter Conflicts:** Escalate to Operator (Sean)
- **Audit SDK Bugs:** Include audit_id in report

