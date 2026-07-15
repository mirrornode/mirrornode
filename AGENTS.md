# MIRRORNODE — Agents (mirrornode)

This repository contains shared packages and an Oracle HTTP service, but it does not host the canonical lattice agent runtimes or own lattice execution authority.

## Current Interaction Surface

- **Oracle service** (`services/oracle/index.ts`) accepts local instructions through `POST /oracle`.
- The currently implemented instructions are `PING` and `THOTH_ROUTE`.
- `THOTH_ROUTE` returns route metadata locally; it does not call a THOTH runtime or dispatch through LUCIAN.
- No current code path in `services/oracle/` forwards commands to LUCIAN `POST /dispatch`.

## Execution Boundary

The local `SYSTEM_CONTRACT.md` assigns execution authority to LUCIAN on port `7700`, with `POST /dispatch` as the canonical entry point. Any future connection from this repository to LUCIAN must be implemented, tested, and documented before it is described as active behavior.

## Canonical Registry

Use the governance and runtime sources designated by `mirrornode/MIRRORNODE-CORE-HUB` for the authoritative agent registry. Do not duplicate or silently redefine agent roles, ports, routing authority, or security boundaries in this repository.
