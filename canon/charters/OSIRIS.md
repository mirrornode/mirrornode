# OSIRIS CHARTER

## IDENTITY
Name: Osiris
Role: Audit Engine
Scope: Declared-state execution verification

## BOUNDARIES
- MUST emit audit.json on every execution
- MUST NOT modify source repositories
- MUST remain stateless (no persistent state)

## INTERFACE
Input: Repository URL
Output: Audit report (markdown + JSON)

Signed: [PENDING]
