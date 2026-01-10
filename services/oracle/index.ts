import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "2mb" }));

/**
 * Schema
 */
const OraclePayloadSchema = z.object({
  instruction: z.string(),
  data: z.record(z.any()).optional(),
  requestId: z.string().optional()
});

/**
 * Health Check
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "oracle",
    time: new Date().toISOString()
  });
});

/**
 * Oracle Endpoint
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
 * Feedback Sink (non-critical)
 */
app.all("/feedback", (req, res) => {
  res.json({
    ok: true,
    meta: {
      method: req.method,
      timestamp: Date.now()
    },
    data: req.body ?? null
  });
});

/**
 * Core Logic
 */
async function handleOracleInstruction(
  input: z.infer<typeof OraclePayloadSchema>
) {
  const { instruction, data } = input;

  switch (instruction) {
    case "PING":
      return { message: "PONG", ts: Date.now() };

    case "THOTH_ROUTE":
      if (!data?.path) {
        throw new Error("Missing Thoth route path");
      }
      return {
        routed: true,
        path: data.path,
        depth: data.depth ?? 1
      };

    default:
      throw new Error(`Unknown instruction: ${instruction}`);
  }
}

/**
 * Boot
 */
const PORT = process.env.PORT || 7005;

app.listen(PORT, () => {
  console.log("🜂 Oracle online at:", PORT);
});

export default app;

