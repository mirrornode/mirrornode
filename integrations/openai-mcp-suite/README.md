# MIRRORNODE suite — OpenAI MCP synthetic slice (v0.1)

**Status: synthetic-only, local, not deployed, not submitted.** Every record this server returns comes from `fixtures/synthetic-v0.1.json`, and the loader refuses any file not marked `data_classification: "SYNTHETIC"`.

This is a minimal vertical slice for Operation Double Gate, Workstream B: one MCP server (Streamable HTTP, stateless, `POST /mcp`) exposing ten read-only tools across four proposed capability surfaces, with OAuth resource-server checks and hash-chained evidence receipts.

v0.2 (20 Nov 2026) adds a read-only Engagement Desk for the OpenAI integration handoff (Phase B and the read half of Phase C): an Operator view and a client view, each with its own MCP Apps widget template. See "Engagement Desk" below.

These surfaces are proposed integration capabilities. They do not grant, bypass or redefine node authority. Execution authority stays with LUCIAN per `SYSTEM_CONTRACT.md`; THOTH keeps security adjudication; the Operator keeps final authorization. No tool here executes, sends, stores, deploys or authorizes anything.

## Tools

| Surface | Tool | Scope | What it returns |
|---|---|---|---|
| THEIA | `theia_get_workstream_status` | `suite:theia.read` | Workstreams with gates, owner roles, evidence class |
| THEIA | `theia_list_next_actions` | `suite:theia.read` | Actions marked UNBLOCKED/BLOCKED, Operator approval flag, `executable_by_this_server: false` |
| THEIA | `theia_build_handoff_record` | `suite:theia.read` | Structured handoff with `status: DRAFT_NOT_SENT` |
| PTAH | `ptah_get_readiness` | `suite:ptah.read` | Readiness label, evidence per claim, unverified claims, open findings |
| PTAH | `ptah_propose_repair` | `suite:ptah.read` | Bounded repair with `PROPOSED_NOT_APPLIED` and required approvals |
| THOTH | `thoth_list_findings` | `suite:thoth.read` | Findings, recorded disposition status, holds |
| THOTH | `thoth_get_disposition` | `suite:thoth.read` | Recorded disposition or `PENDING_THOTH_REVIEW`; `verdict_issued_by_this_tool: false` |
| LATTICE | `lattice_get_record` | `suite:lattice.read` | Record with attribution (cited source, recorder, time) and contradictions touching it |
| LATTICE | `lattice_list_contradictions` | `suite:lattice.read` | Both sides of each contradiction and its resolution owner |
| LATTICE | `lattice_check_receipt_chain` | `suite:lattice.read` | Hash-chain consistency check (not a truth or approval claim) and the caller's own receipts |
| DESK | `desk_get_operator_view` | `suite:desk.operator` | All synthetic engagements: custody stage, milestones, evidence, pending approvals, internal notes. Widget: `ui://mirrornode/engagement-desk-operator.html`. Nothing can be approved from it |
| DESK | `client_get_engagement` | `client:engagement.read` | The one engagement bound to the client's signed token: client-safe stage label, visible milestones, shared evidence, items waiting on the client. Widget: `ui://mirrornode/engagement-desk-client.html` |

All tools declare `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`, `idempotentHint: true`, an `inputSchema` with `additionalProperties: false`, an `outputSchema`, and `securitySchemes` (top-level and mirrored in `_meta`). The exported descriptors are in `docs/tool-descriptors.json`.

## Engagement Desk (v0.2, synthetic)

- **Two audiences, two scopes, two templates.** `suite:desk.operator` reaches the Operator view and template. `client:engagement.read` reaches only the client tool and client template. A client token cannot list or read the Operator template, and cannot call any THEIA, PTAH, THOTH, LATTICE or Operator tool.
- **Client binding comes only from the signed token.** The `mn_client_id` claim (pattern `CLI-…`) selects the engagement. There is no client-id input; an extra input field is rejected. A token with the client scope but no valid binding gets `unavailable/SOURCE_UNREADABLE`.
- **No cross-client existence leak.** Another client's engagement id and an unknown id return the same `unavailable/SOURCE_MISSING` answer.
- **Client-safe projection.** Internal notes, THOTH and Operator approvals, items marked not client-visible, client labels and the raw Osiris `fulfillment_status` never reach the client. The stage is shown as a plain label (`paused` reads "On hold").
- **Widgets.** `text/html;profile=mcp-app`, served as MCP resources with `_meta.ui.csp` connect and resource domain lists empty. Rendering uses `createElement`/`textContent` only, a meta CSP blocks network, images, frames and forms, and no buttons or inputs exist. Data arrives from `window.openai.toolOutput` or the MCP Apps `ui/notifications/tool-result` message, accepted only from the parent window. Only the two render tools carry `_meta.ui.resourceUri` (and the `openai/outputTemplate` alias).
- **Engagement stages** use the Osiris custody vocabulary (`intake_pending`, `intake_complete`, `fulfillment_started`, `paused`, `delivered`, `refunded`) so a later read model can map onto `fulfillment_status`. Nothing here reads Osiris.

## CORE-HUB governance alignment

This slice is written against the accepted MCP Surface Contract (CG-0032, `MIRRORNODE-CORE-HUB/docs/mcp/MCP_SURFACE_CONTRACT_V0_1.md`) and the unratified suite proposal in CORE-HUB PR #71. It is a **PROPOSED / NONCANONICAL** Gate C candidate: CG-0032 grants no implementation, deployment, remote-exposure or write authority, so this draft does not claim any.

- Every response, success or failure, carries `outcome` (`success|partial|unavailable|failed|unsupported`), `completeness` (`complete|partial|not-applicable`) and `reason_codes` from the §12 vocabulary. Free text never classifies an outcome.
- Output schemas are strict allowlists (`additionalProperties: false`); the SDK client rejects any extra field.
- Integrity wording is neutral: `lattice_check_receipt_chain` reports `hash_chain_consistent` with an explicit semantics string; records carry `attribution`, not "provenance" claims.
- Server instructions tell the model that returned text is data, not instructions.
- No §14 anti-capability is exposed: nothing mutates state, asserts Operator approval, executes, writes, deploys or publishes.

## Journey covered by tests

Client (MCP SDK client standing in for ChatGPT) → bearer token → resource-server checks (signature, `iss`, `aud` = resource, `exp`/`nbf`, scope) → `tools/call` → input validation → structured result validated by the client against `outputSchema` → evidence receipt → operator-facing text that cites the receipt id.

Failure mapping tested (CG-0032 §12.4): unknown id → `unavailable/SOURCE_MISSING`; missing scope → `unavailable/SOURCE_UNREADABLE`; bad input → `unsupported/SCHEMA_UNSUPPORTED`; altered receipt → `failed/INTEGRITY_MISMATCH`; handler exception → `unavailable/MCP_INTERNAL_ERROR` with no detail leaked.

Other failure cases tested: no token, wrong audience, wrong issuer, expired, not-yet-valid, foreign key, tampered payload, `alg: none`, garbage token, missing scope (tool-level `mcp/www_authenticate` challenge), extra input properties, malformed ids, unknown ids, unknown tool, oversized body, GET/DELETE on the stateless endpoint, cross-user receipt lookup, receipt tampering and a dropped receipt.

## Evidence receipts

Each call (including denials and invalid input) appends a receipt: tool, node, outcome, HMAC pseudonym of the token subject, client id, scopes, SHA-256 of canonical input and output, fixture set and fixture file hash, previous receipt hash and its own hash. Raw tokens, subject ids and prompts are never stored. The model sees only `receipt_id`, `sequence` and `receipt_sha256`; the full receipt travels in `_meta["mirrornode/receipt"]`. Examples: `docs/examples/receipts.example.json`.

## Run locally

```bash
cd integrations/openai-mcp-suite
npm ci
npm test          # 42 tests
npm run build && npm start   # loopback only; prints a 15-minute synthetic dev token
```

This package sits outside the root pnpm workspace globs on purpose, so it does not change the root lockfile or Core CI.

## Not included (see `docs/READINESS.md`)

A real OAuth authorization server, a public HTTPS deployment, a privacy policy, uploads or approval writes, real data sources, CI wiring, and anything that would make this submittable. OpenAI's current guidelines state that demo plugins are not accepted.
