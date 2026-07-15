# MIRRORNODE — Architecture

**Repo role:** TypeScript monorepo containing shared cores, agents, starter kits, and the Oracle service.  
**Governance authority:** `mirrornode/MIRRORNODE-CORE-HUB`  
**Local operational contract:** `SYSTEM_CONTRACT.md`

## Repository Structure

```text
cores/            — shared core packages
agents/           — agent-related packages and adapters
starter-kits/     — starter implementations
services/oracle/  — TypeScript Oracle HTTP service
api/              — root Vercel Python entry point
```

## Oracle Service — Current State

- `services/oracle/index.ts` exposes `GET /health`, `POST /oracle`, and `/feedback`.
- `POST /oracle` currently handles `PING` and `THOTH_ROUTE` locally.
- The service does not currently call LUCIAN or implement `POST /dispatch` forwarding.
- `services/oracle/vercel.json` currently deploys `index.ts` with the `@vercel/node` builder.
- `services/oracle/package.json` defines `vercel-build` as `npm run build`, which runs `tsc`.

## Execution Boundary

This repository does not own lattice execution authority. The system contract assigns execution authority to LUCIAN on port `7700`, with `POST /dispatch` as LUCIAN's real entry point.

A future Oracle-to-LUCIAN integration may forward approved lattice commands to that endpoint, but documentation must not describe that integration as active until the code path exists and is verified.

## Root Vercel Deployment

The root `vercel.json` currently uses the `@vercel/python` builder for `api/index.py`, routes incoming requests to that entry point, and includes `canon/**` through its function configuration.

## Explicit Non-Routes

The following names are prohibition examples from the system contract and must not be implemented as routes:

- `/system/execute`
- `/system/replay`
- `/execute-task`
