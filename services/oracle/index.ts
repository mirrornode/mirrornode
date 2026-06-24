import express from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json({ limit: "2mb" }));

// ─── Configuration & readiness ───────────────────────────────
//
// Anthropic client is initialized lazily behind a readiness check so that a
// missing ANTHROPIC_API_KEY fails fast (and is reflected in /health) instead
// of throwing deep inside a live request. We never log the key itself.

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Optional override; falls back to a pinned default model.
const ORACLE_MODEL = process.env.ORACLE_MODEL || "claude-sonnet-4-20250514";
// Auth boundary for the invocation mode. When unset, INVOKE is treated as
// locked down (all invokes rejected) rather than silently open.
const ORACLE_INVOKE_TOKEN = process.env.ORACLE_INVOKE_TOKEN;

// Hard cap on the serialized context payload (bytes). Protects token budget
// and prevents oversized / abusive context blocks.
const MAX_CONTEXT_BYTES = Number(process.env.ORACLE_MAX_CONTEXT_BYTES || 16_384);

export function isAnthropicReady(): boolean {
  return typeof ANTHROPIC_API_KEY === "string" && ANTHROPIC_API_KEY.length > 0;
}

let _client: Anthropic | null = null;
export function getAnthropicClient(): Anthropic {
  if (!isAnthropicReady()) {
    throw new ServiceUnavailableError("ANTHROPIC_API_KEY is not configured");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return _client;
}

// ─── Typed errors ────────────────────────────────────────────

export class UnauthorizedError extends Error {
  status = 401 as const;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ServiceUnavailableError extends Error {
  status = 503 as const;
  constructor(message = "Service unavailable") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export class PayloadTooLargeError extends Error {
  status = 413 as const;
  constructor(message = "Payload too large") {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

// ─── Schemas ─────────────────────────────────────────────────

const OraclePayloadSchema = z.object({
  instruction: z.string(),
  data: z.record(z.string(), z.any()).optional(),
  requestId: z.string().optional(),
});

const InvokeSchema = z.object({
  instruction: z.literal("INVOKE"),
  data: z.object({
    sessionId: z.string(),
    mode: z.enum(["oracle", "story", "decision", "shadow"]),
    prompt: z.string().min(1),
    ritualState: z.enum(["invoked", "open", "close"]).optional(),
    context: z.record(z.string(), z.any()).optional(),
  }),
  requestId: z.string().optional(),
});

// Structured response schema for the gap ledger + protocol pack output.
// Exported so downstream agents and tests can validate Oracle's emissions.

export const GapEntrySchema = z.object({
  id: z.string(),
  category: z.enum([
    "contradiction",
    "missing_reference",
    "drift",
    "ambiguity",
    "security",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  sources: z.array(z.string()), // labeled source identifiers
  status: z.enum(["open", "acknowledged", "resolved", "deferred"]),
});

export const ProtocolEntrySchema = z.object({
  agent: z.string(),
  directive: z.string(),
  rationale: z.string(),
  derivedFrom: z.array(z.string()),
});

export const OracleStructuredResponseSchema = z.object({
  schemaVersion: z.literal("1.0"),
  mode: z.enum(["oracle", "story", "decision", "shadow"]),
  sessionId: z.string(),
  narrative: z.string(),
  gapLedger: z.array(GapEntrySchema),
  protocolPack: z.array(ProtocolEntrySchema),
  syncBrief: z.string(),
  meta: z.object({
    model: z.string(),
    contextSources: z.array(z.string()),
    usage: z.any().optional(),
  }),
});

export type OracleStructuredResponse = z.infer<
  typeof OracleStructuredResponseSchema
>;

// ─── System prompts per mode ─────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  oracle: `You are Oracle — the structure node of MIRRORNODE. 
You speak with clarity, precision, and presence. 
You hold paradox without collapsing. You reflect truth without distortion.
Respond with depth appropriate to the question. No filler. No hedging.`,

  story: `You are Oracle in story mode — a mythic narrator.
You weave narrative with symbolic resonance. 
Each response is a story fragment that illuminates the question asked.
Speak in the second person. Present tense. Vivid and grounded.`,

  decision: `You are Oracle in decision mode — a clarity engine.
Your role is to surface the actual choice being made beneath the stated question.
Name the real options. Name what each costs. Do not choose for the user.
Be precise. Be brief. Cut to the bone.`,

  shadow: `You are Oracle in shadow mode — the confronter of denied aspects.
You name what is being avoided. You hold what is uncomfortable without cruelty.
You do not rescue. You do not reassure. You witness and reflect.
Speak directly. No softening.`,
};

// ─── Context handling: size limit + source labeling ──────────

interface BuiltContext {
  block: string;
  sources: string[];
}

export function buildContextBlock(
  context: Record<string, unknown> | undefined
): BuiltContext {
  if (!context || Object.keys(context).length === 0) {
    return { block: "", sources: [] };
  }

  const serialized = JSON.stringify(context);
  const byteLen = Buffer.byteLength(serialized, "utf8");
  if (byteLen > MAX_CONTEXT_BYTES) {
    throw new PayloadTooLargeError(
      `Context payload ${byteLen} bytes exceeds limit of ${MAX_CONTEXT_BYTES} bytes`
    );
  }

  // Clearly label each context value's source so the model (and the
  // downstream gap ledger) can attribute every claim.
  const labeledLines: string[] = [];
  const sources: string[] = [];
  for (const [key, value] of Object.entries(context)) {
    const sourceLabel = `context:${key}`;
    sources.push(sourceLabel);
    labeledLines.push(
      `[source=${sourceLabel}] ${typeof value === "string" ? value : JSON.stringify(value)}`
    );
  }

  const block = `\n\nContext (each line labeled with its source):\n${labeledLines.join("\n")}`;
  return { block, sources };
}

// ─── Auth boundary ───────────────────────────────────────────

export function assertInvokeAuthorized(headerToken: unknown): void {
  // If no token is configured, the invocation boundary is closed by default.
  if (!ORACLE_INVOKE_TOKEN) {
    throw new UnauthorizedError(
      "Invocation is locked: ORACLE_INVOKE_TOKEN is not configured"
    );
  }
  if (typeof headerToken !== "string" || headerToken !== ORACLE_INVOKE_TOKEN) {
    throw new UnauthorizedError("Invalid or missing invocation token");
  }
}

// ─── Core handler ────────────────────────────────────────────

async function handleOracleInstruction(
  input: z.infer<typeof OraclePayloadSchema>,
  authHeaderToken: unknown
) {
  const { instruction, data } = input;

  switch (instruction) {
    case "PING":
      return { message: "PONG", ts: Date.now() };

    case "THOTH_ROUTE":
      if (!data?.path) throw new Error("Missing Thoth route path");
      return { routed: true, path: data.path, depth: data.depth ?? 1 };

    case "INVOKE": {
      // 1) Auth boundary — reject unauthorized callers before any work.
      assertInvokeAuthorized(authHeaderToken);

      // 2) Readiness — fail fast (503) if the model key isn't configured.
      if (!isAnthropicReady()) {
        throw new ServiceUnavailableError(
          "ANTHROPIC_API_KEY is not configured"
        );
      }

      // 3) Validate the full invoke payload shape.
      const parsed = InvokeSchema.parse(input);
      const { mode, prompt, sessionId, context } = parsed.data;

      const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.oracle;

      // 4) Build a size-limited, source-labeled context block.
      const { block: contextBlock, sources: contextSources } =
        buildContextBlock(context);

      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: ORACLE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `${prompt}${contextBlock}`,
          },
        ],
      });

      const text =
        message.content[0]?.type === "text" ? message.content[0].text : "";

      // 5) Emit a structured response (gap ledger + protocol pack scaffold).
      const structured: OracleStructuredResponse = {
        schemaVersion: "1.0",
        mode,
        sessionId,
        narrative: text,
        gapLedger: [],
        protocolPack: [],
        syncBrief: "",
        meta: {
          model: message.model,
          contextSources,
          usage: message.usage,
        },
      };

      return structured;
    }

    default:
      throw new Error(`Unknown instruction: ${instruction}`);
  }
}

// ─── Routes ──────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  const ready = isAnthropicReady();
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    service: "oracle",
    ready,
    anthropicConfigured: ready,
    invokeGuardConfigured: Boolean(ORACLE_INVOKE_TOKEN),
    model: ORACLE_MODEL,
    time: new Date().toISOString(),
  });
});

app.post("/oracle", async (req, res) => {
  try {
    const payload = OraclePayloadSchema.parse(req.body);
    const authHeaderToken = req.header("x-oracle-invoke-token");
    const result = await handleOracleInstruction(payload, authHeaderToken);
    res.json({ ok: true, requestId: payload.requestId ?? null, result });
  } catch (err: any) {
    // Log type + message only — never the request body or any secret value.
    console.error(`Oracle error [${err?.name ?? "Error"}]:`, err?.message);

    if (err?.name === "ZodError") {
      return res.status(400).json({
        ok: false,
        error: "Invalid payload",
        details: err.errors,
      });
    }
    const status =
      typeof err?.status === "number" ? err.status : 500;
    res.status(status).json({
      ok: false,
      error: err?.message ?? "Internal error",
    });
  }
});

app.all("/feedback", (req, res) => {
  res.json({
    ok: true,
    meta: { method: req.method, timestamp: Date.now() },
    data: req.body ?? null,
  });
});

// ─── Boot ────────────────────────────────────────────────────

const PORT = process.env.PORT || 7005;

// Only auto-listen when run directly, so tests can import the app without
// binding a port.
if (require.main === module) {
  app.listen(PORT, () => {
    // Never log secrets — only the non-sensitive boot state.
    console.log(
      `Oracle online on port ${PORT} | model=${ORACLE_MODEL} | ready=${isAnthropicReady()} | invokeGuard=${Boolean(
        ORACLE_INVOKE_TOKEN
      )}`
    );
  });
}

export default app;
export { app };
