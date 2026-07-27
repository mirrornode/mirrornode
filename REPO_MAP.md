# REPO MAP — MIRRORNODE SYSTEM

## Declared Repositories

### MIRRORNODE-CORE-HUB
Role: Organization-level governance and coordination record
Source of truth for:
- canonical source mapping
- cross-repo governance records
- audit milestones
- system-level issue anchors
- operator decision records

### mirrornode
Role: Monorepo, orchestration root, and active runtime work surface
Source of truth for:
- repo-local runtime code
- service implementations currently housed in this repo
- repo-local system contracts
- Oracle runtime PRs while Oracle remains implemented here

## Oracle Rule
Oracle governance language is declared through CORE-HUB and REPO_MAP.
Oracle runtime truth lives where the runnable Oracle service lives.

As of 2026-06-24:
- Oracle runtime PR #7 lives in mirrornode.
- Any future migration to CORE-HUB must be explicit.

## Repo-of-Truth Rule
Governance questions -> CORE-HUB
Repo role questions -> REPO_MAP.md
Runtime questions -> the repo containing the runnable service
Ambiguous questions -> Operator decision

## Last confirmed
2026-06-24

## Confirmed by
Operator
