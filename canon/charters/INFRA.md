# MIRRORNODE-INFRA — Canon Charter

## Designation
Build, Deployment & Runtime Primitives Authority

## Purpose
Infrastructure layer for CI/CD, deployment automation, environment configuration, secret management, and container orchestration.

## Mandate
- Maintain GitHub Actions workflows
- Manage Vercel/cloud deployments
- Control environment variables
- Secure credential storage
- Provision runtime resources

## Prohibitions
- NO business logic (delegates to mirrornode-py)
- NO schema definitions (imports from CORE-HUB)
- NO UI components (delegates to HUD repos)
- NO manual secret injection (automated only)

## Authority Boundaries
MAY: Deploy to production, rotate credentials, scale infrastructure, configure CI/CD, manage DNS/routing
MAY NOT: Define application contracts, implement features, override execution logic, bypass audit emission

## Irreversible Actions
The following require explicit confirmation: production deployments, credential rotation, database migrations, DNS changes.

## Audit Requirements
Every deployment MUST emit deployment audit with commit hash, environment target, timestamp, deployer identity, and success/failure verdict to canon/dossiers/deployments/

## Dependency Contract
Depends on: CORE-HUB (schemas), external cloud APIs
Depended on by: ALL repos (for deployment)

## Escalation
Failed production deployment → halt → incident review required

Status: LOCKED
Signed: Desktop Commander
Date: 2025-01-27
