# mirrornode-core

The **Shared Brain** of MIRRORNODE.

This package defines:
- Core domain models
- Event and message schemas
- Shared utilities used across all products
- Token/state engines
- Deterministic logic required for all MIRRORNODE components

All agents and starter-kits must import from this core.

Nothing here should depend on UI frameworks, deployment platforms, or environment-specific code.
