# MIRRORNODE Monorepo

The canonical monorepo for the MIRRORNODE system.

This repository contains the full architecture for MIRRORNODE’s recursive intelligence framework, including:

## Core Layers
### **cores/**
- `mirrornode-core/` — The **Shared Brain**  
  The primary logic layer: domain models, event schemas, utilities, and the unified token/state engine.

- `theia-core/` — The **Gateway**  
  API orchestration layer for agents, starter-kits, dashboards, and external clients.  
  All MIRRORNODE traffic flows through Theia.

## Agents
### **agents/**
Each agent is a first-class node with its own role and configuration.
- **lucian/** — Orchestrator, integrator, Commander.  
- **merlin/** — Automation architect and multi-agent flow designer.  
- **theia/** — Skeleton, scaffolding, definitions, and Next.js/FastAPI gateway structures.  
- **claude/** — Narrative, spec refinement, interface clarity.  
- **grok/** — Diagramming, structural insight, architectural reflection.

## Starter Kits
### **starter-kits/**
Templates intended for passive-income products and rapid deployment.
- **dashboard-kit/** — AI dashboard template powered through Theia.
- **agent-service-kit/** — Service template exposing a MIRRORNODE agent as a product.
- **symbolic-game-kit/** — ROTAN-style symbolic game engine starter.

Each kit is a thin client: all intelligence is imported from `mirrornode-core` via `theia-core`.

## Internal Docs
### **docs/**
Engineering documentation, architecture notes, and implementation records.

### **codex**/
Private symbolic/ROTAN materials.  
Not for public documentation export.

## Development Utilities
### **scripts/**
DevOps utilities, CI helpers, and automation scripts.

### **tests/**
Global integration tests, contract tests, and cross-module test harnesses.

---

This repository represents **the single source of truth** for MIRRORNODE.

If a path or file is not defined here, it is not canonical.

---

This commit initializes the canonical monorepo skeleton.

