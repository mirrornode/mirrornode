import { createHmac, randomBytes } from "node:crypto";
import express, { type Request, type Response, type NextFunction } from "express";
import { z } from "zod/v4";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { loadFixtures, type LoadedFixtures } from "./fixtures.js";
import { ReceiptLedger, canonicalJson, sha256, type Receipt } from "./receipts.js";
import { AuthError, protectedResourceMetadata, verifyBearer, wwwAuthenticate, type AuthConfig } from "./auth.js";
import { TOOLS, type ToolDef } from "./tools.js";

export const SERVER_NAME = "mirrornode-suite-synthetic";
export const SERVER_VERSION = "0.1.0";
export const INSTRUCTIONS =
  "Read-only MIRRORNODE suite over SYNTHETIC fixtures. THEIA tools report workstream status and draft handoffs; PTAH tools report readiness and bounded repair proposals; THOTH tools report recorded security dispositions and never issue verdicts; LATTICE tools return records with provenance and contradictions. Nothing here executes, sends, deploys or authorizes. Every call returns an evidence receipt.";

const jsonSchema = (s: z.ZodType) => { const { $schema, ...rest } = z.toJSONSchema(s) as Record<string, unknown>; void $schema; return rest; };

export function envelopeSchema(tool: ToolDef) {
  return z.object({
    node: z.literal(tool.node),
    data_classification: z.literal("SYNTHETIC"),
    fixture_set: z.string(),
    result: tool.result,
    receipt: z.object({ receipt_id: z.string(), sequence: z.number().int(), receipt_sha256: z.string() }),
  });
}

export function toolDescriptors() {
  return TOOLS.map((t) => {
    const securitySchemes = [{ type: "oauth2", scopes: [t.scope] }];
    return {
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: jsonSchema(t.input),
      outputSchema: jsonSchema(envelopeSchema(t)),
      annotations: { title: t.title, readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      securitySchemes,
      _meta: { securitySchemes },
    };
  });
}

export interface SuiteOptions {
  auth: AuthConfig;
  fixturesPath?: string;
  receiptsJsonlPath?: string;
  /** Key for pseudonymizing token subjects in receipts. Random per process if omitted. */
  subjectKey?: Uint8Array;
}

export function createSuite(opts: SuiteOptions) {
  const fixtures: LoadedFixtures = loadFixtures(opts.fixturesPath);
  const ledger = new ReceiptLedger(opts.receiptsJsonlPath);
  const descriptors = toolDescriptors();

  const subjectKey = opts.subjectKey ?? randomBytes(32);
  /** HMAC pseudonym: stable per subject within one key, not reversible or guessable without the key. */
  function subjectHash(auth?: AuthInfo) {
    return createHmac("sha256", subjectKey).update(`${opts.auth.issuer}:${String(auth?.extra?.sub ?? "anonymous")}`).digest("hex");
  }

  function record(tool: ToolDef, auth: AuthInfo | undefined, outcome: Receipt["outcome"], input: unknown, output: unknown): Receipt {
    return ledger.append({
      tool: tool.name, node: tool.node, outcome,
      subject_sha256: subjectHash(auth), client_id: auth?.clientId ?? "unknown",
      scopes_granted: [...(auth?.scopes ?? [])].sort(), scope_required: tool.scope,
      input_sha256: sha256(canonicalJson(input ?? {})), output_sha256: sha256(canonicalJson(output ?? null)),
      fixture_set: fixtures.data.fixture_set, fixture_sha256: fixtures.sha256, data_classification: "SYNTHETIC",
    });
  }

  function buildMcpServer(): Server {
    const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, { capabilities: { tools: {} }, instructions: INSTRUCTIONS });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: descriptors as any }));
    server.setRequestHandler(CallToolRequestSchema, async (req, extra): Promise<CallToolResult> => {
      const tool = TOOLS.find((t) => t.name === req.params.name);
      if (!tool) throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${req.params.name}`);
      const auth = extra.authInfo;
      const args = req.params.arguments ?? {};

      if (!auth || !auth.scopes.includes(tool.scope)) {
        const r = record(tool, auth, "DENIED", args, null);
        return {
          isError: true,
          content: [{ type: "text", text: `This tool needs the ${tool.scope} permission, which the current sign-in does not grant. Receipt ${r.receipt_id}.` }],
          _meta: {
            "mcp/www_authenticate": [wwwAuthenticate(opts.auth, { code: "insufficient_scope", description: `Requires ${tool.scope}`, scope: tool.scope })],
            "mirrornode/receipt": r,
          },
        };
      }

      const parsed = tool.input.safeParse(args);
      if (!parsed.success) {
        const r = record(tool, auth, "INVALID_INPUT", args, null);
        return { isError: true, content: [{ type: "text", text: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"} ${i.message}`).join("; ")}. Receipt ${r.receipt_id}.` }], _meta: { "mirrornode/receipt": r } };
      }

      const sub = subjectHash(auth);
      const out = tool.handler({
        fx: fixtures.data,
        subjectSha256: sub,
        receiptsForSubject: () => ledger.all().filter((x) => x.subject_sha256 === sub),
        verifyChain: () => ledger.verify(),
      }, parsed.data);

      if (!out.ok) {
        const r = record(tool, auth, "NOT_FOUND", parsed.data, null);
        return { isError: true, content: [{ type: "text", text: `${out.message} Receipt ${r.receipt_id}.` }], _meta: { "mirrornode/receipt": r } };
      }

      const body = { node: tool.node, data_classification: "SYNTHETIC" as const, fixture_set: fixtures.data.fixture_set, result: out.result };
      const r = record(tool, auth, "OK", parsed.data, body);
      const structuredContent = { ...body, receipt: { receipt_id: r.receipt_id, sequence: r.sequence, receipt_sha256: r.receipt_sha256 } };
      return {
        structuredContent,
        content: [{ type: "text", text: `[SYNTHETIC] ${out.text} Receipt ${r.receipt_id}.` }],
        _meta: { "mirrornode/receipt": r },
      };
    });
    return server;
  }

  const app = express();
  app.disable("x-powered-by");
  const prm = protectedResourceMetadata(opts.auth);
  app.get(["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"], (_req, res) => { res.json(prm); });
  app.get("/healthz", (_req, res) => { res.json({ ok: true, data_classification: "SYNTHETIC", fixture_set: fixtures.data.fixture_set }); });

  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      (req as Request & { auth?: AuthInfo }).auth = await verifyBearer(opts.auth, req.headers.authorization);
      next();
    } catch (e) {
      const code = e instanceof AuthError ? e.code : "invalid_token";
      res.status(401).set("WWW-Authenticate", wwwAuthenticate(opts.auth, req.headers.authorization ? { code, description: (e as Error).message } : undefined))
        .json({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null });
    }
  };

  app.post("/mcp", express.json({ limit: "64kb" }), requireAuth, async (req, res) => {
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { void transport.close(); void server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req as Request & { auth?: AuthInfo }, res, req.body);
    } catch {
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  });
  app.all("/mcp", (_req, res) => { res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed (stateless server)" }, id: null }); });

  return { app, ledger, fixtures, descriptors };
}
