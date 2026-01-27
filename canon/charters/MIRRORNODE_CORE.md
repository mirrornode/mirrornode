# Charter: MIRRORNODE-CORE

**Repository:** github.com/yourusername/mirrornode-core  
**Authority:** Sean Malm  
**Chartered:** 2026-01-27

## Mandate
Production HTTP API service providing:
- Health monitoring endpoints
- Request routing foundation
- Vercel deployment infrastructure
- Docker containerization
- CI/CD pipeline (GitHub Actions)

## Prohibitions
- SHALL NOT modify canon governance (read-only import)
- SHALL NOT bypass health check requirements
- SHALL NOT deploy without passing CI tests
- SHALL NOT expose internal state without audit trail
- SHALL NOT accept unauthenticated write operations

## Audit Requirements
- All deployments must emit audit events
- Health checks must be externally verifiable
- CI/CD failures must block deployment
- Docker builds must be reproducible
