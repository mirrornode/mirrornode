# MIRRORNODE-CORE-HUB — Canon Charter

## Designation
Authority Routing & Shared Contract Repository

## Purpose
Central coordination point for shared type definitions, interfaces, cross-repo contracts, dependency version authority, and constitutional document hosting.

## Mandate
- Publish canonical schemas (TypeScript, JSON Schema, AsyncAPI)
- Maintain dependency manifests
- Host charter documents for all repos
- Provide SDK for shared primitives

## Prohibitions
- NO execution logic (delegates to mirrornode-py)
- NO deployment operations (delegates to INFRA)
- NO UI rendering (delegates to HUD repos)
- NO data storage (schemas only, not instances)

## Authority Boundaries
MAY: Define interfaces, version contracts, declare dependencies, emit schema updates
MAY NOT: Execute business logic, manage infrastructure, store application state, override other repo charters

## Audit Requirements
Every schema change MUST include semver bump rationale, document breaking changes, emit audit event with schema hash, and link to dependent repos.

## Dependency Contract
Depends on: NOTHING (foundation layer)
Depended on by: ALL repos (must import, not duplicate)

## Escalation
Schema conflicts → halt → Operator approval required

Status: LOCKED
Signed: Desktop Commander
Date: 2025-01-27
