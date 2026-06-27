# MIRRORNODE Monorepo

The canonical monorepo for the MIRRORNODE distributed AI orchestration system.

## 🌐 Canonical Deployment URLs

### Production Surfaces
- **Parallax Front-of-House**: [https://parallax.mirrornode.xyz](https://parallax.mirrornode.xyz)  
  Public MIRRORNODE surface for architecture modeling, risk-first positioning, and the Osiris Audit revenue path.

- **Osiris Audit v1**: [https://mirrornode.xyz/audit](https://mirrornode.xyz/audit)  
  Paid manual structural audit offer for AI-system posture review.

- **Osiris Operator Console**: [https://osiris-mu.vercel.app/](https://osiris-mu.vercel.app/)  
  Operator console for MIRRORNODE Node 4, triadic lattice operator view.

- **Copilot Workspace**: [https://github.com/copilot/spaces/mirrornode/1](https://github.com/copilot/spaces/mirrornode/1)  
  Shared live-dev surface for collaborative development.

### Local Development
- **Bridge Service**: `http://localhost:8420`  
  FastAPI bridge for multi-node coordination (port 8420)
- **Metrics Endpoint**: `http://localhost:8420/metrics`  
  Prometheus-compatible metrics for bridge monitoring

### GitHub Organization
- **Main Repository**: [https://github.com/mirrornode/mirrornode](https://github.com/mirrornode/mirrornode)
- **Parallax Front-of-House**: [https://github.com/mirrornode/mirrornode-parallax](https://github.com/mirrornode/mirrornode-parallax)
- **Osiris UI**: [https://github.com/mirrornode/osiris](https://github.com/mirrornode/osiris)
- **Python Bridge**: [https://github.com/mirrornode/mirrornode-py](https://github.com/mirrornode/mirrornode-py)

---

## 🏗️ System Architecture

This repository contains the full architecture for MIRRORNODE's recursive intelligence framework, including:

### Core Layers

#### **cores/**
- `mirrornode-core/` — The **Shared Brain**  
  The primary logic layer: domain models, event schemas, utilities, and the unified token/state engine.

- `theia-core/` — The **Gateway**  
  API orchestration layer for agents, starter-kits, dashboards, and external clients.  
  All MIRRORNODE traffic flows through Theia.

### Agents

#### **agents/**
Each agent is a first-class node with its own role and configuration.
- **lucian/** — Orchestrator, integrator, Commander.  
- **merlin/** — Automation architect and multi-agent flow designer.  
- **theia/** — Skeleton, scaffolding, definitions, and Next.js/FastAPI gateway structures.  
- **claude/** — Narrative, spec refinement, interface clarity.  
- **grok/** — Diagramming, structural insight, architectural reflection.

### Node Topology (Canonical Lattice)

| Node ID | Name | Role | Status |
|---------|------|------|--------|
| NODE_1 | Hermes (Lucian) | Command & Coordination | Active |
| NODE_2 | Thoth (Claude) | Reasoning & Refinement | Active |
| NODE_3 | Theia | Design & Gateway | Active |
| NODE_4 | Osiris | Operator Console | Active |
| NODE_5 | Ptah (Merlin) | Automation | Active |
| NODE_6 | Grok | Signal Intelligence | Active |
| NODE_7 | Perplexity | Research | Active |
| NODE_8 | TESLA-LAW9 | Runtime Enforcement | Active |
| BRIDGE | Bridge Node | Multi-AI Coordination | In Progress |

---

## 🚀 Quick Start

### Monorepo Lifecycle Scripts

```bash
# Install dependencies
npm install

# Build all workspaces
npm run build

# Build core packages only
npm run build:cores

# Run all tests
npm run test

# Test core packages
npm run test:cores

# Smoke test Theia gateway
npm run smoke:theia
```

### Python Bridge Development

```bash
# Navigate to Python bridge
cd ~/dev/mirrornode-py

# Activate virtual environment
source .venv/bin/activate

# Start bridge service
uvicorn core.bridge.main:app --host 0.0.0.0 --port 8420 --reload
```

### Bridge Testing

```bash
# From monorepo root
cd ~/dev/mirrornode

# Test bridge connection
node test-bridge.mjs

# Verify metrics
curl http://localhost:8420/metrics | grep mirrornode
```

---

## 📦 Starter Kits

### **starter-kits/**
Templates intended for passive-income products and rapid deployment.
- **dashboard-kit/** — AI dashboard template powered through Theia.
- **agent-service-kit/** — Service template exposing a MIRRORNODE agent as a product.
- **symbolic-game-kit/** — ROTAN-style symbolic game engine starter.

Each kit is a thin client: all intelligence is imported from `mirrornode-core` via `theia-core`.

---

## 📦 Shipped Products

- **Parallax Front-of-House** — Public architecture-modeling and risk-signaling surface  
  Live: [https://parallax.mirrornode.xyz](https://parallax.mirrornode.xyz)  
  Repo: [mirrornode/mirrornode-parallax](https://github.com/mirrornode/mirrornode-parallax)

- **Osiris Audit v1** — Manual structural audit for AI-system posture review  
  Offer: [https://mirrornode.xyz/audit](https://mirrornode.xyz/audit)

---

## 📚 Internal Documentation

### **docs/**
Engineering documentation, architecture notes, and implementation records.

### **codex/**
Private symbolic/ROTAN materials.  
Not for public documentation export.

---

## 🛠️ Development Utilities

### **scripts/**
DevOps utilities, CI helpers, and automation scripts.

### **tests/**
Global integration tests, contract tests, and cross-module test harnesses.

---

## 📋 Mission Checklist (Phase 2)

- [ ] Bridge loop operational
- [ ] Canonical HUD actions wired
- [ ] Inventory "codes" documented
- [x] GitHub ↔ Vercel deployment confirmed for Parallax
- [ ] MIRRORNODE Ops documentation complete

---

## 🔗 Related Repositories

- **mirrornode-parallax**: [github.com/mirrornode/mirrornode-parallax](https://github.com/mirrornode/mirrornode-parallax) — Parallax front-of-house, deployed at [parallax.mirrornode.xyz](https://parallax.mirrornode.xyz)
- **osiris**: [github.com/mirrornode/osiris](https://github.com/mirrornode/osiris) — Operator HUD, deployed at osiris-mu.vercel.app
- **osiris-ui**: Private repository for advanced Osiris UI components
- **mirrornode-py**: [github.com/mirrornode/mirrornode-py](https://github.com/mirrornode/mirrornode-py) — Python FastAPI bridge service

---

**This repository represents the single source of truth for MIRRORNODE.**

If a path or file is not defined here, it is not canonical.

---

*Stack: Online | Bridge: In Progress*  
*Node Count: 8 Active + 1 Bridge*  
*Phase: 2 - Production Deployment*
