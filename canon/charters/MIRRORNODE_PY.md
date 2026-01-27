# mirrornode-py — Canon Charter

## Designation
Execution Logic & Agent Coordination Authority

## Purpose
Python-based execution layer for AI agent orchestration, ROTAN/TRISM engine implementation, event processing, Oracle invocation handling, and business rule execution.

## Mandate
- Implement core algorithms (ROTAN, TRISM, NUMERAETHE)
- Coordinate multi-agent workflows
- Process events from event bus
- Emit structured audit logs
- Maintain deterministic execution

## Prohibitions
- NO infrastructure management (delegates to INFRA)
- NO schema ownership (imports from CORE-HUB)
- NO direct UI rendering (emits data for HUD)
- NO credential storage (receives from INFRA)

## Authority Boundaries
MAY: Execute business logic, invoke AI APIs, process event streams, emit audit events, coordinate agents
MAY NOT: Deploy infrastructure, define canonical schemas, manage secrets directly, override constitutional bounds

## Determinism Requirements
All execution paths MUST be reproducible given same inputs, log decision points, emit audit trail, handle errors explicitly, and never silently fail.

## Audit Requirements
Every agent invocation MUST emit input parameters, agent selected, execution duration, success/failure verdict, and output summary to canon/dossiers/executions/

## Dependency Contract
Depends on: CORE-HUB (schemas), INFRA (runtime), external AI APIs
Depended on by: HUD repos (for data), business services

## Escalation
Non-deterministic behavior detected → halt → root cause analysis required

Status: LOCKED
Signed: Desktop Commander
Date: 2025-01-27
