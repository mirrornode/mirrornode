# Distribution readiness — MIRRORNODE suite synthetic slice v0.1

Prepared 18 Nov 2026 for Operation Double Gate, Workstream B. Evidence labels: OBSERVED (read or run directly), REPORTED (stated by a source, not checked), INFERRED, BLOCKED, UNKNOWN.

**Disposition: BLOCKED for release.** The synthetic slice works locally and is ready for engineering review as a draft PR. A live ChatGPT connection is blocked on an authorization server and a public HTTPS deployment, both outside this task's authority. Publication is blocked on policy and account prerequisites listed below.

## 0. Update 20 Nov 2026 — OpenAI integration handoff (Phase A/B/C)

OpenAI Support case 20613412 gave build guidance (MCP Apps SDK, test as a ChatGPT custom MCP plugin, review requirements, submit when ready). It is support guidance, not technical approval, partnership or publication authorization.

**Docs re-read 20 Nov 2026.** `developers.openai.com/apps-sdk` now serves the Plugins landing page (canonical `/plugins`); OBSERVED. Also read: `/plugins/build/mcp-server`, `/plugins/build/chatgpt-ui`, `/plugins/build/auth`, `/plugins/deploy/connect-chatgpt`, `/plugins/deploy/app-review`; their quotes came through a fetch summary, so they are REPORTED until a reviewer reads the pages directly. `help.openai.com/articles/20001040` did not load; UNKNOWN. Pages carry no dates and the changelog was not re-read.

Changes or sharper wording since the 18 Nov read (REPORTED):

- The directory is described as one universal plugin directory shared by ChatGPT and Codex.
- "Only submit the plugin if you intend for it to be publicly available"; private use goes through a custom MCP server connection. This supports keeping MIRRORNODE as a private connector until a public listing is decided.
- Redirect URI: copy the exact value shown on the plugin management page (18 Nov notes named a fixed URI; treat the management page as authoritative).
- Submission needs a stable public HTTPS endpoint; tunnels are not accepted for submission. Reviewers need a demo account without MFA. Submitter permission is named `api.apps.write`.
- Widget contract: MIME `text/html;profile=mcp-app`; tool links its template with `_meta.ui.resourceUri` (`openai/outputTemplate` alias); "only the render tool should include `_meta.ui.resourceUri`"; `_meta.ui.csp` with `connectDomains`, `resourceDomains`, `frameDomains` kept narrow; data via `ui/notifications/tool-result` (alias `window.openai.toolOutput`); widget-initiated calls via `tools/call` (alias `window.openai.callTool`); state in `widgetState`, not localStorage. Custom UI is optional.
- Test path in ChatGPT: Plugins → + → "Add custom MCP server" → "Create as a plugin". No plan named; account and workspace policies apply.

**Phase mapping.**

| Phase | Ask | State in this package |
|---|---|---|
| A | MCP foundation, THEIA/PTAH/THOTH/LATTICE tools, synthetic, permissions enforced | Built (v0.1, 10 tools, scope per surface) |
| B | In-ChatGPT Engagement Desk, Operator experience distinct from client | Read-only slice built: `desk_get_operator_view` + Operator widget. No approvals or writes |
| C | Project-scoped authenticated client access: intake, uploads, progress, deliverable review, milestone approval | Read half only: `client_get_engagement` + client widget, binding from signed `mn_client_id`. Intake, uploads, review and approval writes not built |

**Widget handshake.** The templates follow the MCP Apps spec in `@modelcontextprotocol/ext-apps` 2.0.4 (read from the npm package, 20 Nov): they post `ui/initialize` (protocol `2026-01-26`) to the parent, send `ui/notifications/initialized` once the host answers, then render `ui/notifications/tool-result` from the parent window; `window.openai.toolOutput` is also read. Which protocol version ChatGPT negotiates is UNKNOWN until a ChatGPT custom-plugin test.

**New gaps for Phase B/C.**

- The authorization server must put a verified client binding (`mn_client_id`) in client tokens and must never let a user choose it. No AS is chosen yet.
- Tenant isolation is per-claim filtering over synthetic fixtures. Real data needs row-level enforcement at the source (for Osiris, RLS plus the operator-only RPCs), not only filtering in this server.
- Writes (uploads, milestone approval, deliverable acceptance) need: `readOnlyHint: false` tools with accurate `destructiveHint`, human confirmation, digest/version/recipient binding like Osiris review-before-delivery (platform PR #64), THOTH review, and a decision on file storage and retention. Restricted data rules forbid collecting credentials, card data, government ids or PHI through the plugin.
- A public listing of a client portal for a paid digital service conflicts with current commerce rules (no selling digital services or linking checkout from the plugin). A private custom connector per client avoids listing but still needs the AS and hosting.

## 1. Integration target (B1)

Sources read 18 Nov 2026 on developers.openai.com: `apps-sdk/build/mcp-server`, `apps-sdk/mcp-apps-in-chatgpt`, `apps-sdk/changelog`, `apps-sdk/app-submission-guidelines`, `plugins/build/auth`, `plugins/guides/security-privacy`, `plugins/deploy/connect-chatgpt`, `plugins/deploy/submission`.

### Verified (OBSERVED in official docs)

- **Naming.** The distributable unit is now a *plugin* listed in a directory shared by ChatGPT and Codex. "Apps SDK" pages remain for building the MCP server and UI. Packages that contain `apps` / `.app.json` cannot currently be submitted.
- **Transport.** MCP Streamable HTTP, conventionally at `/mcp`. One MCP server per plugin.
- **Tools.** `name`, `title`, `description`, `inputSchema`, `outputSchema` (recommended since May 2026 for structured results), `annotations`. Submission requires explicit booleans for `readOnlyHint`, `destructiveHint`, `openWorldHint`. Results use `structuredContent`, `content`, and `_meta` (hidden from the model; not an authorization mechanism). Server `instructions` are read at initialization; keep key guidance in the first 512 characters.
- **Auth.** Anonymous read-only servers are allowed; customer data or writes should authenticate. OAuth 2.1 authorization code + PKCE with `S256` advertised. Protected resource metadata (RFC 9728) at `/.well-known/oauth-protected-resource` or via `WWW-Authenticate` on 401. Authorization server metadata at `/.well-known/oauth-authorization-server` or `/.well-known/openid-configuration`. Client registration by CIMD (preferred) or DCR. Redirect URI `https://chatgpt.com/connector_platform_oauth_redirect` when the AS supports RFC 9207 issuer identification. ChatGPT sends `resource`; the token should carry it as `aud`. Validate signature, `iss`, `exp`/`nbf`, audience and scopes on every request. Per-tool `securitySchemes` (`noauth`, `oauth2` with scopes). Tool-level linking via an error result with `_meta["mcp/www_authenticate"]` including `error` and `error_description`.
- **Security and privacy.** Least privilege, data minimization, redact PII before logging, correlation ids, no raw prompt storage unless needed, server-side validation of model-provided input, human confirmation for irreversible actions, published retention policy, honor deletion, monitor auth failures, keep dependencies patched.
- **Testing.** Public HTTPS endpoint or Secure MCP Tunnel; MCP Inspector for direct calls; add the server in ChatGPT under Plugins → Add custom MCP server.
- **Submission.** platform.openai.com/plugins; verified individual or business; organization owner or Apps Management Write permission; plugin ZIP; stable public HTTPS endpoint with domain verification; automated tool scan; reviewer credentials for a fully featured demo account with sample data; five positive and three negative test cases; video walkthrough; release notes; policy attestations; published privacy policy; customer support contact. One active review per plugin. After approval the developer chooses when to publish; MCP server changes are rescanned daily.
- **Policy limits that bind MIRRORNODE.** "Trial or demo plugins will not be accepted." Commerce is limited to physical goods; digital products and services cannot be sold, and plugins cannot link to checkout or upgrade flows. Restricted data (payment card data, PHI, government ids, credentials and secrets) may not be collected. No requests for full conversation history. Must work on desktop and mobile. Suitable for ages 13–17.

### Optional

UI component via the MCP Apps standard (`_meta.ui.resourceUri`, MIME `text/html;profile=mcp-app`; `openai/outputTemplate` is a compatibility alias); skills in the plugin package; `idempotentHint`; Codex distribution.

### Unknown

- Whether `securitySchemes` is authoritative at the tool's top level or in `_meta` (the auth page shows both). This slice sets both.
- Which ChatGPT plans or workspace roles may add a custom MCP server today (the connect page only says account and workspace policies apply).
- The allowed values for the plugin `category` field.
- Whether an operator-only, single-tenant tool like this would be listed publicly or should stay a private custom connector.
- Whether any authorization server MIRRORNODE already uses (for example Supabase Auth) supports CIMD or DCR, PKCE `S256` metadata and RFC 9207. Not checked.

## 2. What was built (B2/B3)

`integrations/openai-mcp-suite/` — TypeScript, `@modelcontextprotocol/sdk` 1.32.2 low-level `Server`, Express, `jose`, `zod` 4.6.7. Stateless Streamable HTTP with JSON responses. Ten read-only tools (see README). 29 tests pass locally with vitest 5.1.1 on Node 22. `npm audit`: 0 vulnerabilities. Output-schema validation was confirmed to fail on a deliberately broken result (mutation check, reverted).

The ChatGPT leg is simulated by the MCP SDK client. No ChatGPT session was connected, because that needs a public endpoint.

## 3. Integration manifest

Draft only: `distribution/draft-plugin/.codex-plugin/plugin.json` and `.mcp.json`. All URLs are `example.invalid` placeholders; icons do not exist.

## 4. Permission matrix

| Tool | Scope | Reads | Writes | External calls | Human approval |
|---|---|---|---|---|---|
| theia_get_workstream_status | suite:theia.read | workstreams | none | none | none |
| theia_list_next_actions | suite:theia.read | workstreams, actions | none | none | none (reports which actions need Operator approval) |
| theia_build_handoff_record | suite:theia.read | workstreams, actions | none (draft returned, not sent) | none | Operator decides whether to send |
| ptah_get_readiness | suite:ptah.read | components, findings | none | none | none |
| ptah_propose_repair | suite:ptah.read | findings, repairs | none (not applied) | none | Review at exact head, THOTH for Medium+, Operator before merge/deploy |
| thoth_list_findings | suite:thoth.read | findings | none | none | none |
| thoth_get_disposition | suite:thoth.read | findings | none (never issues a verdict) | none | THOTH owns verdicts |
| lattice_get_record | suite:lattice.read | records, contradictions | none | none | none |
| lattice_list_contradictions | suite:lattice.read | records, contradictions | none (never resolves) | none | Resolution owner per record |
| lattice_check_receipt_chain | suite:lattice.read | receipts (own only) | none | none | none |

The only side effect of any call is appending its own receipt.

## 5. Authentication design

- **Implemented:** resource-server side. RFC 9728 metadata at `/.well-known/oauth-protected-resource` (and `/mcp` suffix). 401 + `WWW-Authenticate: Bearer resource_metadata="…"` without a token; `error="invalid_token"` with a bad token. JWT verified with `jose`: ES256/RS256 only, `iss`, `aud` = resource, `exp`/`nbf` with 30s skew, required `sub`/`exp`. Per-tool scope check with a tool-level `mcp/www_authenticate` challenge.
- **Test-only:** `DevIssuer` mints ES256 JWTs from an in-memory key. It is not an authorization server.
- **Missing for ChatGPT:** an authorization server with authorize/token endpoints, PKCE `S256`, CIMD or DCR, RFC 9207 `iss` in responses, consent screen, refresh tokens, and a JWKS endpoint the server can fetch (`createRemoteJWKSet`). Recommended: CIMD with the stable redirect. Operator choice.

## 6. Privacy and data handling

- Today: synthetic fixtures only; loader rejects anything else; fixture content test blocks email-, card-, key- and JWT-shaped strings.
- Receipts store HMAC pseudonyms of `iss:sub`, hashes of input and output, and no raw tokens, prompts or ids. Users can list only their own receipts.
- No conversation history requested; inputs are ids and enums with `additionalProperties: false`; 64 KB body cap.
- Before real data: a published privacy policy and retention period (receipts and logs), deletion handling, a log-redaction policy, a decision on which real records are exposed and to whom, and THOTH review of the tool surfaces.

## 7. Test results

29/29 passing (vitest 5.1.1, Node 22.23.5, 18 Nov 2026). Groups: auth (13), contract and fixtures (5), journey, failure cases and CG-0032 failure mapping (11). Full list in the draft PR description.

## 8. Deployment prerequisites (not authorized in this task)

Public HTTPS host with a stable `/mcp` URL and verified domain; DNS-rebinding/host allowlist; production authorization server; real JWKS; persistent append-only receipt store; rate limiting and auth-failure alerting; secret management for the HMAC subject key; CI job for this package; Operator authorization; THOTH clearance.

## 9. Review and publication checklist

- [ ] Operator decides: private custom connector vs public directory listing
- [ ] Replace synthetic fixtures with authorized real sources (public listing rejects demo plugins)
- [ ] OpenAI organization verification completed; submitter has owner or Apps Management Write
- [ ] Authorization server chosen and integrated (PKCE S256, CIMD or DCR, RFC 9207)
- [ ] Public HTTPS endpoint, domain verification, automated tool scan passes
- [ ] Privacy policy, terms, support URL and website published; manifest placeholders replaced
- [ ] Icons and logos (square, ≥48 px)
- [ ] Reviewer demo account with sample data; 5 positive + 3 negative test cases; video; release notes
- [ ] Tested in ChatGPT on desktop and mobile
- [ ] No pricing, checkout links or promotion in any model-readable or listing text
- [ ] THOTH review of tool surfaces and auth; independent code review at exact head
- [ ] Policy attestations completed by the Operator

## 10. MIRRORNODE governance gates (CORE-HUB)

- **CG-0032 MCP Surface Contract** (accepted 2026-07-23): read-only projection only; grants no implementation, deployment, remote-exposure or write authority. This slice follows its §7 allowlisting, §4/§5 neutral integrity wording, §12 outcome/completeness/reason codes and §14 anti-capabilities. Not yet reviewed against it by anyone other than its author.
- **CORE-HUB PR #71** (draft, NOT RATIFIED): proposes THEIA, PTAH, THOTH products plus an internal Lattice, with Gates A–E. This slice is an early Gate C artifact (isolated, synthetic, read-only). Gate A (PTAH feasibility, Hermes research, THOTH review) and Gate B (Operator disposition, Council matter, CG-0032 expansion) are open.
- **Open Operator decision from PR #71 §7:** whether LATTICE is internal-only in v0.1. This slice exposes LATTICE tools to the client; if the answer is internal-only, drop the three `lattice_*` tools and keep receipts server-side.
- **Related:** mirrornode-osiris draft PR #8 (THEIA's synthetic stdio probe on a 2026-07-28 MCP wire shape). This slice uses SDK 1.32.2, whose latest protocol version is 2025-11-25. Which revision ChatGPT negotiates today is UNKNOWN.

## 11. Known limitations

- Synthetic data only; ChatGPT itself never connected.
- No authorization server; dev issuer is test-only.
- Receipts are in memory (optional local JSONL); a restart starts a new chain.
- Stateless only; no SSE streaming or sessions.
- UI: two read-only Engagement Desk templates (v0.2); not yet rendered inside ChatGPT.
- Package not wired into CI.
- Node role framing in this slice (THEIA coordination, THOTH security) follows the Operation Double Gate brief and differs from `SYSTEM_CONTRACT.md` (THEIA "Witness & Observation", THOTH "Services & Health"); LATTICE has no registry row there. Recorded, not reconciled.
- The Osiris $149 offer cannot be sold or linked for checkout from inside a ChatGPT plugin under current commerce rules.
