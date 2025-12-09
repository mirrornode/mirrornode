import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "2mb" }));

const OraclePayloadSchema = z.object({
  instruction: z.string().min(1, "instruction is required"),
   z.record(z.any()).optional(),
  requestId: z.string().optional()
});

type OraclePayload = z.infer<typeof OraclePayloadSchema>;

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "oracle",
    time: new Date().toISOString()
  });
});

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
    if (err.name === "ZodError") {
      return res.status(400).json({
        ok: false,
        error: "Invalid payload",
        details: err.errors
      });
    }
    res.status(500).json({
      ok: false,
      error: err.message ?? "Internal error"
    });
  }
});

app.all("/feedback", (req, res) => {
  res.json({
    ok: true,
    meta: {
      method: req.method,
      timestamp: Date.now()
    },
     req.body ?? null
  });
});

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
      throw new Error(\`Unknown instruction: \${instruction}\`);
  }
}

const PORT = process.env.PORT || 7007;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("🜂 Oracle online at:", PORT);
  });
}

export default app;
