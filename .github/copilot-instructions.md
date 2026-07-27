# Copilot Instructions — mirrornode

## System Context

This repository is a TypeScript monorepo with shared packages and a standalone Oracle HTTP service. Governance authority lives in `mirrornode/MIRRORNODE-CORE-HUB`; the local `SYSTEM_CONTRACT.md` records the current execution boundary and canonical routes.

## Hard Rules

- **This repo does not own lattice execution authority.** LUCIAN is the declared execution authority.
- **Do not invent or implement prohibited routes.** Follow the phantom-route prohibitions recorded in `SYSTEM_CONTRACT.md`; do not reproduce or add non-real route names here.
- **Do not describe planned integrations as active.** Verify the current code path before documenting runtime behavior.
- **Oracle is currently a local instruction service.** It handles `PING` and `THOTH_ROUTE`; it does not yet forward commands to LUCIAN `POST /dispatch`.
- **Keep dependency lockfiles consistent with the package manager actually used by the workspace.** The current root scripts use npm workspaces.

## Architecture Quick Reference

```text
services/oracle/index.ts      — Express service: /health, /oracle, /feedback
services/oracle/vercel.json   — @vercel/node builder for index.ts
services/oracle/package.json  — vercel-build runs npm run build (tsc)
api/index.py                  — root Vercel Python entry point
vercel.json                   — root @vercel/python build and routing config
```

## Change Discipline

- Work on a feature or documentation branch and open a PR to `main`.
- Keep documentation tied to verified files and deployed behavior.
- Do not change execution authority, agent routing, or governance claims without corresponding canon review.
- Do not rewrite active Vercel configuration merely to match a preferred convention; change configuration only as an explicit, tested migration.

## Verification

Before proposing a merge:

- Run the relevant TypeScript build or tests for changed workspaces.
- Validate the affected Vercel configuration and route behavior.
- Confirm documentation matches the current implementation.
- Run Canon Gate and Core CI.
