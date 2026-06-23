# MIRRORNODE — Architecture

**Repo role:** TypeScript monorepo — frontend platform, oracle service, Vercel deployment  
**Ground Truth:** `mirrornode/MIRRORNODE-CORE-HUB` · `SYSTEM_CONTRACT.md` in `mirrornode-backend`

## Repo Structure

```
services/
  oracle/       — Vercel serverless function, TypeScript
app/            — Next.js frontend (if present)
```

## Oracle Service

- Deployed via Vercel (`vercel.json` uses `functions` config)
- Build: `vercel-build` script handles `npm install + tsc`
- Does not own execution authority — routes through LUCIAN `POST /dispatch` at runtime

## Execution Model

This repo does not implement agent orchestration. Command execution is the domain of `mirrornode-backend` (LUCIAN, port 7700). See `SYSTEM_CONTRACT.md` in `mirrornode-backend` for the full lattice contract.

## Non-Routes

Do not reference `/system/execute`, `/system/replay`, or `/execute-task` — these are not real routes in any MIRRORNODE service.
