# AUDIT EMISSION CONTRACT

## Invariant
Every execution event MUST emit an audit record. No exceptions.

## Schema Version
1.0.0

## Audit Record Structure
```json
deactivate
cd ~/mirrornode
cat > canon/contracts/AUDIT_EMISSION.md <<'EOCONTRACT'
# AUDIT EMISSION CONTRACT

## Invariant
Every execution event MUST emit an audit record. No exceptions.

## Schema Version
1.0.0

## Audit Record Structure
```json
{
  "timestamp": "ISO8601 UTC",
  "repo": "string (repo name)",
  "repo_hash": "string (git commit SHA)",
  "charter_hash": "string (SHA256 of charter file) | 'UNCHARTERED'",
  "event_type": "string (execution|deployment|schema_change|agent_invocation)",
  "actor": "string (human|agent|system)",
  "verdict": "SUCCESS | FAILURE | BLOCKED | ESCALATED",
  "evidence": {
    "inputs": "object (sanitized)",
    "outputs": "object (sanitized)",
    "duration_ms": "number",
    "error": "string | null"
  },
  "audit_id": "string (UUID v4)"
}
```

## Emission Requirements

### All Repos MUST:
1. Import audit SDK from CORE-HUB
2. Call `emit_audit()` at execution boundaries
3. Never catch/suppress audit failures
4. Log to both stdout AND `canon/dossiers/`

### Audit Failures MUST:
1. Halt execution immediately
2. Surface to operator console
3. Never proceed with original operation

## Unchartered Repo Behavior

If no charter exists:
- Audit STILL runs
- `charter_hash` set to `"UNCHARTERED"`
- Verdict includes warning flag
- Does NOT block execution (visibility only)

## Enforcement Mechanism

Osiris MUST:
1. Intercept all execution entry points
2. Verify audit emission occurred
3. Block completion if audit missing
4. Generate weekly compliance reports

## Storage

Audits written to:
- `canon/dossiers/YYYY-MM/audit-{repo}-{timestamp}.json`
- Retention: 90 days minimum
- Format: One JSON object per line (NDJSON)

## Prohibited Actions

- No audit mocking in production
- No conditional audit logic
- No audit data mutation post-emission
- No silent audit failures

Status: LOCKED
Signed: Desktop Commander
Date: 2025-01-27
