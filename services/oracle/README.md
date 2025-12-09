# MIRRORNODE Oracle Service

**Version:** 0.2.0 (Hermes Build)  
**Service:** Oracle API — Instruction router and Thoth integration layer

## Architecture

```
services/oracle/
├── index.ts         → Express API with Zod validation
├── dist/index.js    → Compiled output (Vercel target)
├── package.json     → Dependencies + build scripts
└── tsconfig.json    → TypeScript config
```

## Endpoints

### `GET /health`
Returns service status and timestamp.

**Response:**
```json
{
  "status": "ok",
  "service": "oracle",
  "time": "2025-12-09T..."
}
```

### `POST /oracle`
Execute Oracle instructions.

**Request:**
```json
{
  "instruction": "PING",
  "data": {},
  "requestId": "optional-id"
}
```

**Response:**
```json
{
  "ok": true,
  "requestId": "optional-id",
  "result": { ... }
}
```

### `ALL /feedback`
Feedback collector endpoint.


## Supported Instructions

| Instruction | Data Required | Description |
|------------|---------------|-------------|
| `PING` | None | Health check response |
| `THOTH_ROUTE` | `{path: string, depth?: number}` | Route to Thoth knowledge layer |

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm start

# Dev mode (hot reload)
npm run dev
```

## Vercel Deployment

The service deploys automatically via `vercel.json` in project root.

**Build command:** `npm run vercel-build`  
**Output:** `dist/index.js`

## Environment Variables

None required for base functionality. Add as needed:
- `PORT` — Local server port (default: 7007)
- `ORACLE_SECRET` — API authentication key (optional)

---

**MIRRORNODE Oracle** — The switchboard layer between intelligence nodes.
