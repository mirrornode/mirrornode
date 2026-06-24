# MIRRORNODE — Governance (mirrornode)

**Authority:** `mirrornode/MIRRORNODE-CORE-HUB`

## Principles

1. Documentation reflects real deployed code paths only.
2. Oracle service is stateless; state lives in the lattice (LUCIAN/OSIRIS).
3. No silent failures — surface errors explicitly.
4. Feature branches (`feat/*`) require a PR against `main`; do not push directly to `main` with uncommitted service changes.

## Branch Policy

- `main` — production-ready, deployed to Vercel
- `feat/*` — feature branches, must PR into `main`
- Uncommitted changes to `services/oracle/` must not stay on a feature branch indefinitely

## Build Gate

Before merging to `main`:

- [ ] `pnpm-lock.yaml` committed and consistent
- [ ] `services/oracle/` TypeScript compiles without errors
- [ ] `vercel.json` routes validated
- [ ] No references to non-real routes
