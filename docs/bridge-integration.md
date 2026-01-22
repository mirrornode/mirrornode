**Status:** Frozen / Proven  
**Last verified:** 2026-01-22

This document describes the validated integration between the TypeScript
MirrorNode client and the Python FastAPI bridge, including endpoints,
event flow, and observability.

---

TypeScript emits events → Python FastAPI bridge ingests → metrics exposed
for observability.

TS (mirrornode-core)
└─ BridgeClient
└─ HTTP/JSON
└─ Python FastAPI Bridge
├─ In-memory event store
├─ WebSocket stream
└─ Prometheus /metric

---

## Python Bridge Service

**Base URL (local):** `http://localhost:8420`

### Endpoints

#### Health

Returns service liveness.

**Response:**
```json
{
  "ok": true,
  "events": 1,
  "clients": 0
}

POST /events
Content-Type: application/json

{
  "kind": "OBSERVABILITY",
  "node": "metrics-test",
  "payload": { "note": "hello" }
}

{
  "ok": true,
  "stored": {
    "id": "uuid-here",
    "ts": "2026-01-22T21:45:55.075111+00:00",
    "node": "metrics-test",
    "kind": "OBSERVABILITY",
    "payload": { "note": "hello" }
  }
}

GET /events/recent?limit=20

GET /metrics

Prometheus-format metrics exposition.

Event Schema (v1)
Minimal required fields:

kind (string)

node (string)

payload (object | optional)

Events are treated as opaque payloads by the bridge.

Optional bridge-managed fields:

id (auto-generated UUID if not provided)

ts (auto-generated ISO timestamp if not provided)

Observability (Prometheus)
Metrics Exposed
mirrornode_events_total{kind,node} - Counter of events by type/source

mirrornode_events_stored - Gauge of in-memory event count

mirrornode_websocket_clients - Gauge of active WebSocket connections

mirrornode_http_request_duration_seconds{method,endpoint} - Request latency histogram

Example Verification
POST /events completes in ~3–5ms

Counters increment per event

Histograms record request duration

TypeScript Integration
Package: cores/mirrornode-core

Client: BridgeClient

Posts events to /events

Retrieves recent events from /events/recent

Checks health via /health
import { BridgeClient } from "@mirrornode/mirrornode-core";

const client = new BridgeClient("http://localhost:8420");

await client.health();
await client.postEvent({
  node: "my-service",
  kind: "ANALYSIS",
  payload: { data: "test" }
});

const recent = await client.getRecent(10);

cd ~/dev/mirrornode-py
source .venv/bin/activate
uvicorn core.bridge.main:app --port 8420 --reload

curl -X POST http://localhost:8420/events \
  -H "Content-Type: application/json" \
  -d '{"kind":"OBSERVABILITY","node":"metrics-test","payload":{}}'

curl http://localhost:8420/events/recent
curl http://localhost:8420/metrics | grep mirrornode

cd ~/dev/mirrornode
node test-bridge.mjs

Explicit Non-Goals (v1)
❌ No persistence beyond memory

❌ No authentication

❌ No schema enforcement beyond minimal fields

❌ No LLM logic

❌ No Ray coupling

These are intentional and frozen for v1.

Change Policy
Any changes to:

Endpoints

Event shape

Metrics names

Must be accompanied by:

Documentation update

Integration test update

Version bump

Related Files
TypeScript:

cores/mirrornode-core/src/bridge/BridgeClient.ts

test-bridge.mjs

Python:

core/bridge/main.py

core/bridge/metrics.py
