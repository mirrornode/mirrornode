import type { NextApiRequest, NextApiResponse } from "next";
import { createTheiaGateway } from "@mirrornode/theia-core";

/**
 * Minimal Next.js API route demonstrating usage of createTheiaGateway.
 *
 * POST /api/theia
 * Body: MirrorNodeEvent
 */

const gateway = createTheiaGateway({
  environment:
    process.env.NODE_ENV === "production" ? "production" : "development"
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const event = req.body;
    const response = await gateway.handleEvent(event);
    return res.status(response.ok ? 200 : 500).json(response);
  } catch (err) {
    console.error("API /api/theia error:", err);
    return res.status(500).json({
      ok: false,
      message: "internal server error",
      error: String(err)
    });
  }
}