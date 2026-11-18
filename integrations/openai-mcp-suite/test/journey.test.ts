import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startHarness, type Harness } from "./helpers.js";
import { ALL_SCOPES, SCOPES } from "../src/auth.js";
import { INSTRUCTIONS } from "../src/server.js";

let h: Harness;
beforeAll(async () => { h = await startHarness(); });
afterAll(async () => { await h.close(); });

const CALLS: Array<[string, Record<string, unknown>]> = [
  ["theia_get_workstream_status", {}],
  ["theia_get_workstream_status", { workstream_id: "WS-SYN-B" }],
  ["theia_list_next_actions", { workstream_id: "WS-SYN-A" }],
  ["theia_build_handoff_record", { workstream_id: "WS-SYN-A", to: "OPERATOR" }],
  ["ptah_get_readiness", { component_id: "CMP-SYN-WEBHOOK" }],
  ["ptah_propose_repair", { finding_id: "FND-SYN-001" }],
  ["ptah_propose_repair", { finding_id: "FND-SYN-002" }],
  ["thoth_list_findings", {}],
  ["thoth_get_disposition", { finding_id: "FND-SYN-002" }],
  ["lattice_get_record", { record_id: "REC-SYN-004" }],
  ["lattice_list_contradictions", { status: "UNRESOLVED" }],
  ["lattice_verify_receipts", {}],
];

describe("synthetic journey: client -> auth -> MCP tool -> structured result -> receipt", () => {
  it("initializes with server instructions under 512 chars", async () => {
    const c = await h.client(await h.token(ALL_SCOPES));
    expect(c.getInstructions()).toBe(INSTRUCTIONS);
    expect(INSTRUCTIONS.length).toBeLessThan(512);
    expect(c.getServerVersion()?.name).toBe("mirrornode-suite-synthetic");
  });

  it("calls every tool, validates structured output against outputSchema, and gets a receipt each time", async () => {
    const c = await h.client(await h.token(ALL_SCOPES, "journey-user"));
    await c.listTools(); // primes the SDK client's outputSchema validators
    const before = h.suite.ledger.all().length;
    for (const [name, args] of CALLS) {
      const res: any = await c.callTool({ name, arguments: args }); // SDK throws if structuredContent violates outputSchema
      expect(res.isError, `${name} ${JSON.stringify(res.content)}`).toBeFalsy();
      expect(res.structuredContent.data_classification).toBe("SYNTHETIC");
      expect(res.structuredContent.receipt.receipt_id).toMatch(/^rcpt_/);
      expect(res.content[0].text).toContain(res.structuredContent.receipt.receipt_id);
      expect(res._meta["mirrornode/receipt"].outcome).toBe("OK");
    }
    expect(h.suite.ledger.all().length - before).toBe(CALLS.length);
    expect(h.suite.ledger.verify().valid).toBe(true);
  });

  it("reports authority boundaries rather than acting", async () => {
    const c = await h.client(await h.token(ALL_SCOPES));
    const acts: any = await c.callTool({ name: "theia_list_next_actions", arguments: { workstream_id: "WS-SYN-A" } });
    const a2 = acts.structuredContent.result.actions.find((a: any) => a.id === "ACT-SYN-A2");
    expect(a2).toMatchObject({ state: "BLOCKED", operator_approval_required: true, executable_by_this_server: false });
    expect(a2.blocked_by_open_gates).toEqual(["G-SYN-A2", "G-SYN-A3"]);
    const ho: any = await c.callTool({ name: "theia_build_handoff_record", arguments: { workstream_id: "WS-SYN-B", to: "THOTH" } });
    expect(ho.structuredContent.result.handoff.status).toBe("DRAFT_NOT_SENT");
    const disp: any = await c.callTool({ name: "thoth_get_disposition", arguments: { finding_id: "FND-SYN-002" } });
    expect(disp.structuredContent.result.disposition.status).toBe("PENDING_THOTH_REVIEW");
    expect(disp.structuredContent.result.verdict_issued_by_this_tool).toBe(false);
    const rep: any = await c.callTool({ name: "ptah_propose_repair", arguments: { finding_id: "FND-SYN-001" } });
    expect(rep.structuredContent.result.proposal.status).toBe("PROPOSED_NOT_APPLIED");
    expect(rep.structuredContent.result.proposal.required_approvals).toContain("THOTH security disposition");
    const holds: any = await c.callTool({ name: "thoth_list_findings", arguments: { disposition_status: "HOLD" } });
    expect(holds.structuredContent.result.holds).toEqual(["FND-SYN-001"]);
  });

  it("returns the same result for the same call (idempotent reads)", async () => {
    const c = await h.client(await h.token(ALL_SCOPES));
    const a: any = await c.callTool({ name: "lattice_list_contradictions", arguments: {} });
    const b: any = await c.callTool({ name: "lattice_list_contradictions", arguments: {} });
    expect(a.structuredContent.result).toEqual(b.structuredContent.result);
    expect(a.structuredContent.receipt.receipt_id).not.toBe(b.structuredContent.receipt.receipt_id);
    expect(a._meta["mirrornode/receipt"].output_sha256).toBe(b._meta["mirrornode/receipt"].output_sha256);
  });
});

describe("failure cases", () => {
  it("denies a tool whose scope the token lacks, with a tool-level auth challenge and a DENIED receipt", async () => {
    const c = await h.client(await h.token([SCOPES.THEIA]));
    const res: any = await c.callTool({ name: "thoth_list_findings", arguments: {} });
    expect(res.isError).toBe(true);
    const challenge = res._meta["mcp/www_authenticate"][0];
    expect(challenge).toMatch(/^Bearer resource_metadata="http:\/\/127\.0\.0\.1:\d+\/\.well-known\/oauth-protected-resource"/);
    expect(challenge).toContain('error="insufficient_scope"');
    expect(challenge).toContain("error_description=");
    expect(res._meta["mirrornode/receipt"].outcome).toBe("DENIED");
  });

  it("rejects extra properties and malformed ids before touching data", async () => {
    const c = await h.client(await h.token(ALL_SCOPES));
    const extra: any = await c.callTool({ name: "lattice_get_record", arguments: { record_id: "REC-SYN-001", include_secrets: true } });
    expect(extra.isError).toBe(true);
    expect(extra._meta["mirrornode/receipt"].outcome).toBe("INVALID_INPUT");
    const bad: any = await c.callTool({ name: "lattice_get_record", arguments: { record_id: "../../etc/passwd" } });
    expect(bad.isError).toBe(true);
    expect(bad._meta["mirrornode/receipt"].outcome).toBe("INVALID_INPUT");
  });

  it("returns NOT_FOUND for unknown ids and an MCP error for unknown tools", async () => {
    const c = await h.client(await h.token(ALL_SCOPES));
    const nf: any = await c.callTool({ name: "ptah_get_readiness", arguments: { component_id: "CMP-NOPE" } });
    expect(nf.isError).toBe(true);
    expect(nf._meta["mirrornode/receipt"].outcome).toBe("NOT_FOUND");
    await expect(c.callTool({ name: "ptah_deploy", arguments: {} })).rejects.toThrow(/Unknown tool/);
  });

  it("never lists another user's receipts", async () => {
    const a = await h.client(await h.token(ALL_SCOPES, "user-a"));
    const r: any = await a.callTool({ name: "theia_get_workstream_status", arguments: {} });
    const id = r.structuredContent.receipt.receipt_id;
    const b = await h.client(await h.token(ALL_SCOPES, "user-b"));
    const lookup: any = await b.callTool({ name: "lattice_verify_receipts", arguments: { receipt_id: id } });
    expect(lookup.isError).toBe(true);
    const mine: any = await b.callTool({ name: "lattice_verify_receipts", arguments: {} });
    expect(mine.structuredContent.result.receipts.map((x: any) => x.receipt_id)).not.toContain(id);
    expect(mine.structuredContent.result.chain.valid).toBe(true);
    const own: any = await a.callTool({ name: "lattice_verify_receipts", arguments: { receipt_id: id } });
    expect(own.structuredContent.result.receipts).toHaveLength(1);
  });

  it("keeps raw tokens and subject ids out of receipts", async () => {
    const token = await h.token(ALL_SCOPES, "very-identifiable-subject");
    const c = await h.client(token);
    await c.callTool({ name: "theia_get_workstream_status", arguments: {} });
    const serialized = JSON.stringify(h.suite.ledger.all());
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain("very-identifiable-subject");
  });
});
