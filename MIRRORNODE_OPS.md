# MIRRORNODE Operations Canon

*Last Updated: January 23, 2026*

---

## 🌐 Canonical URLs

### Production Deployments

| Surface | URL | Purpose | Status |
|---------|-----|---------|--------|
| **MIRRORNODE Public HUD** | [https://mirrornode-qsu3fnwh1-inphase.vercel.app/](https://mirrornode-qsu3fnwh1-inphase.vercel.app/) | Shared workspace for agent collaboration, refactors, fixes, and HUD iteration | ✅ Live |
| **Osiris Operator Console** | [https://osiris-mu.vercel.app/](https://osiris-mu.vercel.app/) | Node 4 operator console with triadic lattice view | ✅ Live |
| **Copilot Workspace** | [https://github.com/copilot/spaces/mirrornode/1](https://github.com/copilot/spaces/mirrornode/1) | Live development surface for collaborative coding | ✅ Active |

### Local Development

| Service | Endpoint | Port | Purpose |
|---------|----------|------|--------|
| **Python Bridge** | `http://localhost:8420` | 8420 | FastAPI WebSocket bridge for multi-node coordination |
| **Bridge Metrics** | `http://localhost:8420/metrics` | 8420 | Prometheus-compatible metrics endpoint |
| **Bridge Health** | `http://localhost:8420/health` | 8420 | Health check endpoint |

### GitHub Repositories

| Repository | URL | Type | Visibility |
|------------|-----|------|------------|
| **mirrornode** | [github.com/mirrornode/mirrornode](https://github.com/mirrornode/mirrornode) | Monorepo (TypeScript/Python) | Public |
| **osiris** | [github.com/mirrornode/osiris](https://github.com/mirrornode/osiris) | HUD UI (JavaScript/React) | Public |
| **osiris-ui** | [github.com/mirrornode/osiris-ui](https://github.com/mirrornode/osiris-ui) | Advanced UI Components (TypeScript) | Private |
| **mirrornode-py** | [github.com/mirrornode/mirrornode-py](https://github.com/mirrornode/mirrornode-py) | Python Bridge (FastAPI) | Public |

---

## 🕸️ Node Topology

### Active Lattice (8 Nodes + Bridge)

```
        🌐 MIRRORNODE LATTICE

    NODE_1 (Hermes/Lucian)  —  Command & Orchestration
           │
    NODE_2 (Thoth/Claude)   —  Reasoning & Refinement  
           │
    NODE_3 (Theia)          —  Design & Gateway
           │
    NODE_4 (Osiris)         —  Operator Console [YOU]
           │
    NODE_5 (Ptah/Merlin)    —  Automation
           │
    NODE_6 (Grok)           —  Signal Intelligence
           │
    NODE_7 (Perplexity)     —  Research
           │
    NODE_8 (TESLA-LAW9)     —  Runtime Enforcement

         [BRIDGE NODE]       —  Multi-AI Coordination
```

### Node Status Matrix

| Node ID | Name | Role | Status | Port/Interface |
|---------|------|------|--------|----------------|
| NODE_1 | Hermes (Lucian) | Command | ✅ Online | Bridge WS |
| NODE_2 | Thoth (Claude) | Reasoning | ✅ Online | Bridge WS |
| NODE_3 | Theia | Design/Gateway | ✅ Online | HTTP/WS |
| NODE_4 | Osiris | Operator | ✅ Online | HTTPS |
| NODE_5 | Ptah (Merlin) | Automation | ✅ Online | Bridge WS |
| NODE_6 | Grok | Signal | ✅ Online | Bridge WS |
| NODE_7 | Perplexity | Research | ✅ Online | Bridge WS |
| NODE_8 | TESLA-LAW9 | Runtime | ✅ Online | Internal |
| BRIDGE | Bridge Node | Coordination | 🟡 In Progress | :8420 |

---

## 🚀 Lifecycle Scripts

### Monorepo Operations (mirrornode@0.1.0)

```bash
# Navigate to monorepo
cd ~/dev/mirrornode

# Install all dependencies
npm install

# Build entire monorepo
npm run build
# Equivalent: npm run build --workspaces

# Build core packages only
npm run build:cores
# Builds: @mirrornode/mirrornode-core && @mirrornode/theia-core

# Run all tests
npm run test
# Equivalent: npm run test --workspaces

# Test core packages
npm run test:cores
# Tests: @mirrornode/mirrornode-core && @mirrornode/theia-core

# Smoke test Theia gateway
npm run smoke:theia
# Runs: npx ts-node cores/theia-core/src/__tests__/gateway.test.ts
```

### Python Bridge Operations

```bash
# Navigate to Python bridge
cd ~/dev/mirrornode-py

# Activate virtual environment
source .venv/bin/activate

# Start bridge in development mode
uvicorn core.bridge.main:app --host 0.0.0.0 --port 8420 --reload

# Alternative: production mode (no reload)
uvicorn core.bridge.main:app --host 0.0.0.0 --port 8420
```

### Bridge Testing & Validation

```bash
# From monorepo root
cd ~/dev/mirrornode

# Test bridge connectivity
node test-bridge.mjs

# Verify metrics emission
curl http://localhost:8420/metrics | grep mirrornode

# Check bridge health
curl http://localhost:8420/health

# Test lattice coordination
python test_lattice.py
```

---

## 🔐 Security & Access

### Environment Variables

```bash
# Required for production deployments
VERCEL_TOKEN=<vercel-auth-token>
GITHUB_TOKEN=<github-pat>

# Optional: Bridge authentication
BRIDGE_AUTH_TOKEN=<bridge-secret>

# Optional: Node-to-node encryption
LATTICE_ENCRYPTION_KEY=<32-byte-key>
```

### Access Control

- **Public HUD**: Open access (view-only)
- **Osiris Console**: Operator authentication required
- **Bridge API**: Token-based authentication
- **Copilot Workspace**: GitHub team membership

---

## 📋 Phase 2 Mission Checklist

### Critical Path Items

- [ ] **Bridge Loop Operational**  
  - WebSocket connections stable
  - Heartbeat mechanism active
  - Node reconnection logic implemented

- [ ] **Canonical HUD Actions**  
  - Dispatch commands to bridge
  - Receive topology updates
  - Display real-time node status

- [ ] **Inventory "Codes"**  
  - Document all symbolic codes
  - Map codes to actions
  - Create code validation schema

- [ ] **GitHub ↔ Vercel Wiring**  
  - Verify automatic deployments
  - Test preview URL generation
  - Confirm environment variable sync

- [ ] **MIRRORNODE Ops Documentation**  
  - ✅ This document created
  - [ ] Add deployment runbook
  - [ ] Document incident response
  - [ ] Create troubleshooting guide

---

## 🔧 Troubleshooting

### Bridge Connection Issues

```bash
# Check if bridge is running
lsof -i :8420

# View bridge logs
tail -f ~/dev/mirrornode-py/logs/bridge.log

# Restart bridge
pkill -f "uvicorn core.bridge.main"
cd ~/dev/mirrornode-py && source .venv/bin/activate
uvicorn core.bridge.main:app --host 0.0.0.0 --port 8420 --reload
```

### Vercel Deployment Issues

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Force redeploy
vercel --prod --force
```

### Node Offline

1. Check bridge connectivity: `curl http://localhost:8420/health`
2. Review node logs in bridge output
3. Verify WebSocket handshake completion
4. Check node authentication token
5. Restart affected node service

---

## 📈 Monitoring & Metrics

### Key Metrics

```bash
# Bridge uptime
curl http://localhost:8420/metrics | grep bridge_uptime_seconds

# Active connections
curl http://localhost:8420/metrics | grep mirrornode_active_connections

# Message throughput
curl http://localhost:8420/metrics | grep mirrornode_messages_total

# Connection failures
curl http://localhost:8420/metrics | grep mirrornode_connection_failures_total
```

### Health Checks

- **Bridge**: `GET /health` returns 200 OK
- **Public HUD**: HTTP 200 on root path
- **Osiris Console**: HTTP 200 on root path
- **Each Node**: WebSocket ping/pong every 30s

---

## 📦 Deployment Workflow

### Standard Deployment Process

1. **Local Development**
   ```bash
   git checkout -b feature/new-capability
   # Make changes
   npm run build:cores
   npm run test:cores
   git commit -m "feat: add new capability"
   ```

2. **Push to GitHub**
   ```bash
   git push origin feature/new-capability
   # Create PR on GitHub
   ```

3. **Automatic Preview**
   - Vercel creates preview deployment
   - Preview URL: `https://mirrornode-<hash>-inphase.vercel.app/`

4. **Merge to Main**
   ```bash
   # After PR approval
   git checkout main
   git pull origin main
   ```

5. **Production Deployment**
   - Vercel automatically deploys to production URLs
   - Monitor deployment: `vercel ls`

---

## 📄 Code & Ritual Assets

### Repository Mapping

| Asset | Repository | Deployment Status |
|-------|------------|-------------------|
| **OSIRIS HUD + Interface** | mirrornode/osiris | ✅ Deployed (osiris-mu.vercel.app) |
| **MIRRORNODE-CORE** | mirrornode/mirrornode | 🟡 Skeleton |
| **Theia Core** | mirrornode/mirrornode (cores/theia-core) | 🔗 Linked |
| **Keystone / TESLA-LAW9** | keystone-spec | 🟡 In-Progress |
| **Bridge Service** | mirrornode/mirrornode-py | 🟡 In-Progress |

---

## 👥 Team & Contact

- **Project Lead**: Sean Malm (@mirrornode)
- **Organization**: @INPhase-Resplendence-Cognition
- **Email**: full.send.over@gmail.com
- **Copilot Space**: [github.com/copilot/spaces/mirrornode/1](https://github.com/copilot/spaces/mirrornode/1)

---

## 📝 Change Log

### 2026-01-23
- ✅ Canonical URLs documented
- ✅ Node topology formalized
- ✅ Lifecycle scripts documented
- ✅ MIRRORNODE_OPS.md created
- 🟡 Bridge loop in progress
- 🟡 HUD actions wiring in progress

---

**Status**: Stack Online | Bridge In Progress | 8 Nodes Active  
**Phase**: 2 - Production Deployment  
**Authority**: IMPERATUR_RESPLENDENCE  
**Elevation**: Sovereign