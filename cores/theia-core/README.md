# theia-core

The **Gateway / Orchestrator** of MIRRORNODE.

Responsibilities:
- Serve as the main API layer (Next.js API Routes, FastAPI, or equivalent)
- Route all agent and product requests into `mirrornode-core`
- Manage LLM calls, authentication, and rate limiting
- Provide OpenAPI specifications for downstream consumers
- Ensure deterministic behavior across the ecosystem

All downstream projects must interact with MIRRORNODE only through Theia.
