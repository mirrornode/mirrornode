import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

// Mock the Anthropic SDK so no live API calls are made. The mock returns a
// deterministic text block shaped like the real SDK response.
const createMock = vi.fn(async () => ({
  model: "claude-sonnet-4-20250514",
  content: [{ type: "text", text: "reflected truth" }],
  usage: { input_tokens: 10, output_tokens: 5 },
}));

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class {
      messages = { create: createMock };
      constructor(_opts: any) {}
    },
  };
});

// Helper to (re)load the app with a fresh module registry and a specific env.
async function loadApp(env: Record<string, string | undefined>) {
  vi.resetModules();
  // Apply env overrides.
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const mod = await import("./index");
  return mod.default;
}

const BASE_ENV = {
  ANTHROPIC_API_KEY: undefined,
  ORACLE_INVOKE_TOKEN: undefined,
  ORACLE_MODEL: undefined,
  ORACLE_MAX_CONTEXT_BYTES: undefined,
};

beforeEach(() => {
  createMock.mockClear();
  // Clean slate for the relevant env vars each test.
  for (const k of Object.keys(BASE_ENV)) delete process.env[k];
});

afterEach(() => {
  for (const k of Object.keys(BASE_ENV)) delete process.env[k];
});

// ─── PING ────────────────────────────────────────────────────

describe("PING", () => {
  it("returns PONG with a timestamp", async () => {
    const app = await loadApp({ ...BASE_ENV });
    const res = await request(app).post("/oracle").send({ instruction: "PING" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.message).toBe("PONG");
    expect(typeof res.body.result.ts).toBe("number");
  });
});

// ─── THOTH_ROUTE ─────────────────────────────────────────────

describe("THOTH_ROUTE", () => {
  it("routes when a path is provided", async () => {
    const app = await loadApp({ ...BASE_ENV });
    const res = await request(app)
      .post("/oracle")
      .send({ instruction: "THOTH_ROUTE", data: { path: "/canon", depth: 3 } });
    expect(res.status).toBe(200);
    expect(res.body.result).toEqual({ routed: true, path: "/canon", depth: 3 });
  });

  it("defaults depth to 1", async () => {
    const app = await loadApp({ ...BASE_ENV });
    const res = await request(app)
      .post("/oracle")
      .send({ instruction: "THOTH_ROUTE", data: { path: "/canon" } });
    expect(res.body.result.depth).toBe(1);
  });

  it("errors (500) when path is missing", async () => {
    const app = await loadApp({ ...BASE_ENV });
    const res = await request(app)
      .post("/oracle")
      .send({ instruction: "THOTH_ROUTE", data: {} });
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

// ─── INVOKE validation ───────────────────────────────────────

describe("INVOKE validation", () => {
  it("rejects an invalid invoke payload with 400 (when authorized + ready)", async () => {
    const app = await loadApp({
      ...BASE_ENV,
      ANTHROPIC_API_KEY: "test-key",
      ORACLE_INVOKE_TOKEN: "secret-token",
    });
    // Missing required fields (mode, prompt) inside data.
    const res = await request(app)
      .post("/oracle")
      .set("x-oracle-invoke-token", "secret-token")
      .send({ instruction: "INVOKE", data: { sessionId: "s1" } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid payload");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns a structured response on a valid authorized invoke", async () => {
    const app = await loadApp({
      ...BASE_ENV,
      ANTHROPIC_API_KEY: "test-key",
      ORACLE_INVOKE_TOKEN: "secret-token",
    });
    const res = await request(app)
      .post("/oracle")
      .set("x-oracle-invoke-token", "secret-token")
      .send({
        instruction: "INVOKE",
        data: { sessionId: "s1", mode: "oracle", prompt: "What is true?" },
      });
    expect(res.status).toBe(200);
    expect(res.body.result.schemaVersion).toBe("1.0");
    expect(res.body.result.narrative).toBe("reflected truth");
    expect(Array.isArray(res.body.result.gapLedger)).toBe(true);
    expect(Array.isArray(res.body.result.protocolPack)).toBe(true);
    expect(res.body.result.meta.model).toBeDefined();
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("enforces the context byte-size limit with 413", async () => {
    const app = await loadApp({
      ...BASE_ENV,
      ANTHROPIC_API_KEY: "test-key",
      ORACLE_INVOKE_TOKEN: "secret-token",
      ORACLE_MAX_CONTEXT_BYTES: "64",
    });
    const big = "x".repeat(500);
    const res = await request(app)
      .post("/oracle")
      .set("x-oracle-invoke-token", "secret-token")
      .send({
        instruction: "INVOKE",
        data: {
          sessionId: "s1",
          mode: "oracle",
          prompt: "hi",
          context: { blob: big },
        },
      });
    expect(res.status).toBe(413);
    expect(createMock).not.toHaveBeenCalled();
  });
});

// ─── Missing key behavior ────────────────────────────────────

describe("missing ANTHROPIC_API_KEY", () => {
  it("returns 503 on invoke when the key is missing (authorized)", async () => {
    const app = await loadApp({
      ...BASE_ENV,
      ORACLE_INVOKE_TOKEN: "secret-token",
      // No ANTHROPIC_API_KEY.
    });
    const res = await request(app)
      .post("/oracle")
      .set("x-oracle-invoke-token", "secret-token")
      .send({
        instruction: "INVOKE",
        data: { sessionId: "s1", mode: "oracle", prompt: "hi" },
      });
    expect(res.status).toBe(503);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("/health reports degraded (503) when the key is missing", async () => {
    const app = await loadApp({ ...BASE_ENV });
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.ready).toBe(false);
    expect(res.body.anthropicConfigured).toBe(false);
  });

  it("/health reports ok (200) when the key is present", async () => {
    const app = await loadApp({ ...BASE_ENV, ANTHROPIC_API_KEY: "test-key" });
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });
});

// ─── Unauthorized invoke ─────────────────────────────────────

describe("unauthorized invoke", () => {
  it("returns 401 when the invoke token is missing", async () => {
    const app = await loadApp({
      ...BASE_ENV,
      ANTHROPIC_API_KEY: "test-key",
      ORACLE_INVOKE_TOKEN: "secret-token",
    });
    const res = await request(app)
      .post("/oracle")
      .send({
        instruction: "INVOKE",
        data: { sessionId: "s1", mode: "oracle", prompt: "hi" },
      });
    expect(res.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the invoke token is wrong", async () => {
    const app = await loadApp({
      ...BASE_ENV,
      ANTHROPIC_API_KEY: "test-key",
      ORACLE_INVOKE_TOKEN: "secret-token",
    });
    const res = await request(app)
      .post("/oracle")
      .set("x-oracle-invoke-token", "wrong-token")
      .send({
        instruction: "INVOKE",
        data: { sessionId: "s1", mode: "oracle", prompt: "hi" },
      });
    expect(res.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 401 (locked) when no invoke token is configured server-side", async () => {
    const app = await loadApp({
      ...BASE_ENV,
      ANTHROPIC_API_KEY: "test-key",
      // No ORACLE_INVOKE_TOKEN configured -> invocation is locked by default.
    });
    const res = await request(app)
      .post("/oracle")
      .set("x-oracle-invoke-token", "anything")
      .send({
        instruction: "INVOKE",
        data: { sessionId: "s1", mode: "oracle", prompt: "hi" },
      });
    expect(res.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });
});
