
# Charter: THEIA-CORE

**Repository:** github.com/yourusername/theia-core  
**Authority:** Sean Malm  
**Chartered:** 2026-01-27

## Mandate
Event ingestion infrastructure providing:
- MirrorNodeEvent schema validation
- FastAPI ingestion endpoint (/api/mirror)
- Event routing to downstream systems
- HMAC authentication framework

## Prohibitions
- SHALL NOT accept events without schema validation
- SHALL NOT bypass authentication when enabled
- SHALL NOT lose events without logging failure
- SHALL NOT expose raw event data without authorization
- SHALL NOT modify canon governance (read-only import)

## Audit Requirements
- All ingested events must be logged
- Schema violations must be auditable
- Authentication failures must emit alerts
- Health endpoint must reflect ingestion status
