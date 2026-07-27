# MIRRORNODE — Governance (mirrornode)

**Authority:** `mirrornode/MIRRORNODE-CORE-HUB`

## Principles

1. Documentation must reflect verified code paths and current configuration.
2. This repository does not own lattice execution authority.
3. Planned integrations must be labeled as planned until implemented and tested.
4. No silent failures — surface errors explicitly.
5. Changes to routing authority, agent boundaries, or canon require explicit governance review.

## Branch Policy

- `main` is the protected integration branch.
- Feature and documentation changes must arrive through pull requests.
- Do not leave material service changes uncommitted or undocumented on long-lived branches.
- Do not describe a branch as deployed or production-ready solely because it targets `main`; verify the deployment state separately.

## Build and Documentation Gate

Before merging to `main`:

- [ ] Dependency manifests and the lockfile used by the affected workspace are consistent.
- [ ] Changed TypeScript workspaces compile and relevant tests pass.
- [ ] Affected Vercel configuration and routes are validated against the files currently in the repository.
- [ ] Documentation matches the implemented runtime behavior.
- [ ] Planned integrations are not presented as active.
- [ ] Prohibited route names appear only in explicit negation or governance context.
- [ ] Canon Gate and Core CI pass.

## Current Oracle Boundary

`services/oracle/` currently handles local Oracle instructions and does not forward commands to LUCIAN. The system contract identifies LUCIAN `POST /dispatch` as the canonical execution entry point, but that is a system boundary, not an implemented integration claim for this service.
