# Copilot Instructions — mirrornode

## System Context

TypeScript monorepo for the MIRRORNODE platform. Contains the oracle Vercel service and frontend. Agent runtimes live in `mirrornode-backend`.

## Hard Rules

- **This repo does not own execution authority.** Do not implement agent dispatch logic here.
- **Never reference non-real routes:** `/system/execute`, `/system/replay`, `/execute-task`.
- **Oracle service is stateless.** Persistent state belongs in the lattice (LUCIAN/OSIRIS).
- **Always commit `pnpm-lock.yaml`** alongside `package.json` changes.

## Architecture Quick Reference

```
services/oracle/   — Vercel serverless, TypeScript
                      → calls LUCIAN POST /dispatch for lattice ops
```

## Active Branch

Current feature work is on `feat/osiris-execution-layer`. Open a PR to `main` before deploying.

## Conventions

- TypeScript strict mode
- Vercel `functions` config (not legacy `builds`)
- `vercel-build` = `npm install && tsc`
