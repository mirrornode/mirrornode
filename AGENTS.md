# MIRRORNODE — Agents (mirrornode)

This repo does not host agent runtimes. It is the TypeScript/frontend surface of the MIRRORNODE lattice.

## Agent Interaction Points

- **Oracle service** (`services/oracle/`) — may call LUCIAN `POST /dispatch` for lattice commands
- **Frontend** — calls `mirrornode-platform` API routes; does not call agents directly

## Full Agent Registry

See `AGENTS.md` in `mirrornode-backend` for the complete, authoritative agent registry (LUCIAN, OSIRIS, HERMES, THOTH, THEIA, PTAH, EVE).
