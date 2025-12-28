import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "2mb" }));

/**
 * Payload schema
 */
const OraclePayloadSchema = z.object({
  instruction: z.string().min(1, "instruction is required"),
  data: z.record(z.any()).optional(),
  requestId: z.string().optional()
});

type OraclePayload = z.infer<typeof OraclePayloadSchema>;

/**
 * Health check
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "oracle",
    time: new Date().toISOString()
  });
});

/**
 * Main oracle endpoint
 */
app.post("/oracle", async (req, res) => {
  try {
    const payload = OraclePayloadSchema.parse(req.body);
    const result = await handleOracleInstruction(payload);

    res.json({
      ok: true,
      requestId: payload.requestId ?? null,
      result
    });
  } catch (err: any) {
    console.error("Oracle error:", err);

    if (err?.name === "ZodError") {
      return res.status(400).json({
        ok: false,
        error: "Invalid payload",
        details: err.errors
      });
    }

    res.status(500).json({
      ok: false,
      error: err?.message ?? "Internal error"
    });
  }
});

/**
 * Feedback / echo endpoint
 */
app.all("/feedback", (req, res) => {
  res.json({
    ok: true,
    meta: {
      method: req.method,
      timestamp: Date.now()
    },
    body: req.body ?? null
  });
});

/**
 * Oracle logic
 */
async function handleOracleInstruction(input: OraclePayload) {
  const { instruction, data } = input;

  switch (instruction) {
    case "PING":
      return { message: "PONG", ts: Date.now() };

    case "THOTH_ROUTE":
      if (!data || typeof data.path !== "string") {
        throw new Error("Missing Thoth route path");
      }
      return {
        routed: true,
        path: data.path,
        depth: typeof data.depth === "number" ? data.depth : 1
      };

    default:
      throw new Error(`Unknown instruction: ${instruction}`);
  }
}

/**
 * IMPORTANT:
 * Do NOT call app.listen on Vercel.
 * Export the app as the handler.
 */
export default app;

