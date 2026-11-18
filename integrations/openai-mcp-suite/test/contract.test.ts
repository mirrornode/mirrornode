import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startHarness, rpc, type Harness } from "./helpers.js";
import { ALL_SCOPES } from "../src/auth.js";
import { loadFixtures, DEFAULT_FIXTURE_PATH } from "../src/fixtures.js";
import { ReceiptLedger } from "../src/receipts.js";

let h: Harness;
let jsonl: string;
beforeAll(async () => { jsonl = join(mkdtempSync(join(tmpdir(), "suite-")), "receipts.jsonl"); h = await startHarness({ receiptsJsonlPath: jsonl }); });
afterAll(async () => { await h.close(); });

describe("tool descriptors meet the published submission rules", () => {
  it("every tool has explicit boolean annotations, schemas, a description and securitySchemes in both places", async () => {
    const res = await rpc(h.base, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, await h.token(ALL_SCOPES));
    const { result } = await res.json();
    const names = result.tools.map((t: any) => t.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(10);
    for (const t of result.tools) {
      expect(t.description.length).toBeGreaterThan(40);
      expect(t.title).toBeTruthy();
      for (const k of ["readOnlyHint", "destructiveHint", "openWorldHint"]) expect(typeof t.annotations[k]).toBe("boolean");
      expect(t.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
      expect(t.inputSchema.type).toBe("object");
      expect(t.inputSchema.additionalProperties).toBe(false);
      expect(t.outputSchema.type).toBe("object");
      expect(t.outputSchema.additionalProperties).toBe(false);
      expect(t.outputSchema.required).toEqual(expect.arrayContaining(["outcome", "completeness", "reason_codes", "result", "receipt"]));
      expect(t.description).not.toMatch(/\bverif(y|ied|ies)\b/i);
      expect(t.securitySchemes).toEqual([{ type: "oauth2", scopes: [expect.stringMatching(/^suite:(theia|ptah|thoth|lattice)\.read$/)] }]);
      expect(t._meta.securitySchemes).toEqual(t.securitySchemes);
      expect(t.name).toMatch(/^(theia|ptah|thoth|lattice)_[a-z_]+$/);
      expect(JSON.stringify(t.outputSchema)).not.toContain("provenance");
    }
  });
});

describe("fixtures and receipts", () => {
  it("refuses a fixture file not marked SYNTHETIC", () => {
    const raw = JSON.parse(readFileSync(DEFAULT_FIXTURE_PATH, "utf8"));
    const p = join(mkdtempSync(join(tmpdir(), "fx-")), "real.json");
    writeFileSync(p, JSON.stringify({ ...raw, data_classification: "PRODUCTION" }));
    expect(() => loadFixtures(p)).toThrow(/SYNTHETIC/);
  });

  it("contains nothing shaped like an email, card number, key or private key", () => {
    const text = readFileSync(DEFAULT_FIXTURE_PATH, "utf8");
    expect(text).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(text).not.toMatch(/\b(?:\d[ -]?){13,19}\b/);
    expect(text).not.toMatch(/sk_(live|test)_|-----BEGIN|eyJ[A-Za-z0-9_-]{10,}\./);
  });

  it("detects a tampered receipt and a broken link", async () => {
    const c = await h.client(await h.token(ALL_SCOPES));
    for (let i = 0; i < 3; i++) await c.callTool({ name: "thoth_list_findings", arguments: {} });
    const copy = h.suite.ledger.all().map((r) => ({ ...r }));
    expect(new ReceiptLedger().verify(copy).consistent).toBe(true);
    copy[1].outcome = "failed";
    expect(new ReceiptLedger().verify(copy)).toMatchObject({ consistent: false, first_mismatch_sequence: 2 });
    const dropped = h.suite.ledger.all().filter((_, i) => i !== 1);
    expect(new ReceiptLedger().verify(dropped).consistent).toBe(false);
  });

  it("writes receipts as JSONL when a path is configured", async () => {
    const lines = readFileSync(jsonl, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(lines.length).toBe(h.suite.ledger.all().length);
    expect(lines.every((r) => r.data_classification === "SYNTHETIC")).toBe(true);
  });
});
