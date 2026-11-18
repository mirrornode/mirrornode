import { z } from "zod/v4";
import type { Fixtures } from "./fixtures.js";
import type { Receipt } from "./receipts.js";
import { SCOPES } from "./auth.js";

type Node = "THEIA" | "PTAH" | "THOTH" | "LATTICE";

export interface ToolContext {
  fx: Fixtures;
  subjectSha256: string;
  receiptsForSubject: () => Receipt[];
  verifyChain: () => { valid: boolean; checked: number; first_invalid_sequence: number | null };
}
export type HandlerResult =
  | { ok: true; result: unknown; text: string }
  | { ok: false; outcome: "NOT_FOUND"; message: string };

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  node: Node;
  scope: string;
  input: z.ZodObject;
  result: z.ZodType;
  handler: (ctx: ToolContext, input: any) => HandlerResult;
}

const Id = (prefix: string) => z.string().regex(new RegExp(`^${prefix}-[A-Z0-9-]{1,40}$`)).describe(`Identifier starting with ${prefix}-`);
const Evidence = z.enum(["OBSERVED", "REPORTED", "INFERRED", "BLOCKED", "UNKNOWN"]);
const GateOut = z.object({ id: z.string(), description: z.string(), owner_role: z.string(), state: z.enum(["OPEN", "CLOSED"]), evidence_class: Evidence, evidence_ref: z.string().nullable() });
const ActionOut = z.object({
  id: z.string(), description: z.string(), required_authority: z.string(), reversible: z.boolean(),
  blocked_by_open_gates: z.array(z.string()),
  state: z.enum(["UNBLOCKED", "BLOCKED"]),
  operator_approval_required: z.boolean(),
  executable_by_this_server: z.literal(false),
});
const DispositionStatus = z.enum(["HOLD", "CLEARED", "CLEARED_WITH_CONDITIONS", "PENDING_THOTH_REVIEW"]);

const notFound = (what: string, id: string): HandlerResult => ({ ok: false, outcome: "NOT_FOUND", message: `No synthetic ${what} with id ${id}.` });

function actionsFor(fx: Fixtures, wsId: string) {
  const ws = fx.workstreams.find((w) => w.id === wsId)!;
  const openGates = new Set(ws.gates.filter((g) => g.state === "OPEN").map((g) => g.id));
  return fx.actions.filter((a) => a.workstream_id === wsId).map((a) => {
    const blocking = a.blocked_by.filter((g) => openGates.has(g));
    return {
      id: a.id, description: a.description, required_authority: a.required_authority, reversible: a.reversible,
      blocked_by_open_gates: blocking,
      state: (blocking.length ? "BLOCKED" : "UNBLOCKED") as "BLOCKED" | "UNBLOCKED",
      operator_approval_required: a.required_authority === "OPERATOR" || !a.reversible,
      executable_by_this_server: false as const,
    };
  });
}

function dispositionOf(f: Fixtures["findings"][number]) {
  return f.disposition
    ? { status: f.disposition.status as z.infer<typeof DispositionStatus>, recorded_by: f.disposition.recorded_by, recorded_at: f.disposition.recorded_at, clearance_requirements: f.disposition.clearance_requirements }
    : { status: "PENDING_THOTH_REVIEW" as const, recorded_by: null, recorded_at: null, clearance_requirements: ["THOTH review has not been recorded"] };
}
const DispositionOut = z.object({ status: DispositionStatus, recorded_by: z.string().nullable(), recorded_at: z.string().nullable(), clearance_requirements: z.array(z.string()) });

export const TOOLS: ToolDef[] = [
  {
    name: "theia_get_workstream_status",
    title: "Get workstream status",
    node: "THEIA", scope: SCOPES.THEIA,
    description: "Use this to read the current status and gates of a MIRRORNODE workstream from the synthetic fixture set. Returns each gate with its owner role, open/closed state and evidence class. Read-only; it changes nothing.",
    input: z.object({ workstream_id: Id("WS").optional().describe("Workstream id. Omit to list all workstreams.") }).strict(),
    result: z.object({ workstreams: z.array(z.object({ id: z.string(), title: z.string(), status: z.string(), summary: z.string(), gates: z.array(GateOut), open_gate_count: z.number().int() })) }),
    handler: ({ fx }, { workstream_id }) => {
      const list = workstream_id ? fx.workstreams.filter((w) => w.id === workstream_id) : fx.workstreams;
      if (workstream_id && !list.length) return notFound("workstream", workstream_id);
      const workstreams = list.map((w) => ({ id: w.id, title: w.title, status: w.status, summary: w.summary, gates: w.gates, open_gate_count: w.gates.filter((g) => g.state === "OPEN").length }));
      return { ok: true, result: { workstreams }, text: workstreams.map((w) => `${w.id} ${w.status}, ${w.open_gate_count} open gate(s)`).join("; ") };
    },
  },
  {
    name: "theia_list_next_actions",
    title: "List next actions",
    node: "THEIA", scope: SCOPES.THEIA,
    description: "Use this to see which next actions on a workstream are unblocked or blocked by open gates, and which need Operator approval. It reports status only: it grants no authorization and executes nothing.",
    input: z.object({ workstream_id: Id("WS") }).strict(),
    result: z.object({ workstream_id: z.string(), actions: z.array(ActionOut) }),
    handler: ({ fx }, { workstream_id }) => {
      if (!fx.workstreams.some((w) => w.id === workstream_id)) return notFound("workstream", workstream_id);
      const actions = actionsFor(fx, workstream_id);
      return { ok: true, result: { workstream_id, actions }, text: actions.map((a) => `${a.id} ${a.state}${a.operator_approval_required ? " (Operator approval required)" : ""}`).join("; ") };
    },
  },
  {
    name: "theia_build_handoff_record",
    title: "Build handoff record",
    node: "THEIA", scope: SCOPES.THEIA,
    description: "Use this to assemble a structured handoff record for a workstream addressed to one node or the Operator. The record is returned to you as a draft; this tool does not send, store or deliver it anywhere.",
    input: z.object({ workstream_id: Id("WS"), to: z.enum(["THEIA", "PTAH", "THOTH", "LATTICE", "OPERATOR"]) }).strict(),
    result: z.object({
      handoff: z.object({
        status: z.literal("DRAFT_NOT_SENT"), from: z.literal("THEIA"), to: z.string(), workstream_id: z.string(),
        open_gates: z.array(GateOut), unblocked_actions: z.array(ActionOut), blocked_actions: z.array(ActionOut),
        evidence_counts: z.record(z.string(), z.number().int()),
      }),
    }),
    handler: ({ fx }, { workstream_id, to }) => {
      const ws = fx.workstreams.find((w) => w.id === workstream_id);
      if (!ws) return notFound("workstream", workstream_id);
      const actions = actionsFor(fx, workstream_id);
      const evidence_counts: Record<string, number> = {};
      for (const g of ws.gates) evidence_counts[g.evidence_class] = (evidence_counts[g.evidence_class] ?? 0) + 1;
      const handoff = {
        status: "DRAFT_NOT_SENT" as const, from: "THEIA" as const, to, workstream_id,
        open_gates: ws.gates.filter((g) => g.state === "OPEN"),
        unblocked_actions: actions.filter((a) => a.state === "UNBLOCKED"),
        blocked_actions: actions.filter((a) => a.state === "BLOCKED"),
        evidence_counts,
      };
      return { ok: true, result: { handoff }, text: `Draft handoff for ${workstream_id} to ${to}: ${handoff.open_gates.length} open gate(s), ${handoff.unblocked_actions.length} unblocked action(s). Not sent.` };
    },
  },
  {
    name: "ptah_get_readiness",
    title: "Get implementation readiness",
    node: "PTAH", scope: SCOPES.PTAH,
    description: "Use this to summarize implementation readiness of a synthetic component: its readiness label, the evidence behind each claim and its open findings with their recorded security status. Read-only.",
    input: z.object({ component_id: Id("CMP") }).strict(),
    result: z.object({
      component_id: z.string(), title: z.string(), readiness: z.string(),
      evidence: z.array(z.object({ claim: z.string(), evidence_class: Evidence, ref: z.string() })),
      unverified_claims: z.array(z.string()),
      open_findings: z.array(z.object({ id: z.string(), severity: z.string(), title: z.string(), disposition_status: DispositionStatus })),
    }),
    handler: ({ fx }, { component_id }) => {
      const c = fx.components.find((x) => x.id === component_id);
      if (!c) return notFound("component", component_id);
      const open_findings = c.open_findings.map((id) => fx.findings.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => !!f)
        .map((f) => ({ id: f.id, severity: f.severity, title: f.title, disposition_status: dispositionOf(f).status }));
      const unverified_claims = c.evidence.filter((e) => e.evidence_class !== "OBSERVED").map((e) => e.claim);
      return { ok: true, result: { component_id: c.id, title: c.title, readiness: c.readiness, evidence: c.evidence, unverified_claims, open_findings }, text: `${c.id} is ${c.readiness}; ${unverified_claims.length} unverified claim(s), ${open_findings.length} open finding(s).` };
    },
  },
  {
    name: "ptah_propose_repair",
    title: "Propose bounded repair",
    node: "PTAH", scope: SCOPES.PTAH,
    description: "Use this to get the bounded repair proposal on file for a synthetic finding: files in scope, required tests, rollback and the approvals it needs. The proposal is text only; this tool applies no change.",
    input: z.object({ finding_id: Id("FND") }).strict(),
    result: z.object({
      finding_id: z.string(),
      proposal: z.object({
        status: z.literal("PROPOSED_NOT_APPLIED"), summary: z.string(), files_in_scope: z.array(z.string()),
        tests_required: z.array(z.string()), rollback: z.string(), required_approvals: z.array(z.string()),
      }).nullable(),
      reason_if_none: z.string().nullable(),
    }),
    handler: ({ fx }, { finding_id }) => {
      const f = fx.findings.find((x) => x.id === finding_id);
      if (!f) return notFound("finding", finding_id);
      const r = fx.repairs.find((x) => x.finding_id === finding_id);
      if (!r) return { ok: true, result: { finding_id, proposal: null, reason_if_none: "No bounded repair is on file for this finding." }, text: `No bounded repair on file for ${finding_id}.` };
      const required_approvals = ["Independent code review at exact head"];
      if (["CRITICAL", "HIGH", "MEDIUM"].includes(f.severity) || f.disposition?.status === "HOLD") required_approvals.push("THOTH security disposition");
      required_approvals.push("Operator authorization before merge or deploy");
      return { ok: true, result: { finding_id, proposal: { status: "PROPOSED_NOT_APPLIED" as const, summary: r.summary, files_in_scope: r.files_in_scope, tests_required: r.tests_required, rollback: r.rollback, required_approvals }, reason_if_none: null }, text: `Repair proposal for ${finding_id} (not applied): ${r.summary}` };
    },
  },
  {
    name: "thoth_list_findings",
    title: "List security findings",
    node: "THOTH", scope: SCOPES.THOTH,
    description: "Use this to list synthetic security findings, optionally filtered by severity or recorded disposition status. Findings without a recorded THOTH disposition are reported as PENDING_THOTH_REVIEW. Read-only.",
    input: z.object({
      severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]).optional(),
      disposition_status: DispositionStatus.optional(),
    }).strict(),
    result: z.object({ findings: z.array(z.object({ id: z.string(), severity: z.string(), component_id: z.string(), title: z.string(), evidence_class: Evidence, disposition_status: DispositionStatus })), holds: z.array(z.string()) }),
    handler: ({ fx }, { severity, disposition_status }) => {
      const findings = fx.findings.map((f) => ({ id: f.id, severity: f.severity, component_id: f.component_id, title: f.title, evidence_class: f.evidence_class, disposition_status: dispositionOf(f).status }))
        .filter((f) => (!severity || f.severity === severity) && (!disposition_status || f.disposition_status === disposition_status));
      const holds = findings.filter((f) => f.disposition_status === "HOLD").map((f) => f.id);
      return { ok: true, result: { findings, holds }, text: `${findings.length} finding(s); holds: ${holds.join(", ") || "none"}.` };
    },
  },
  {
    name: "thoth_get_disposition",
    title: "Get security disposition",
    node: "THOTH", scope: SCOPES.THOTH,
    description: "Use this to read the recorded security disposition and clearance requirements for one synthetic finding. It reports what is recorded and never issues a new security verdict.",
    input: z.object({ finding_id: Id("FND") }).strict(),
    result: z.object({ finding_id: z.string(), severity: z.string(), title: z.string(), disposition: DispositionOut, verdict_issued_by_this_tool: z.literal(false) }),
    handler: ({ fx }, { finding_id }) => {
      const f = fx.findings.find((x) => x.id === finding_id);
      if (!f) return notFound("finding", finding_id);
      const disposition = dispositionOf(f);
      return { ok: true, result: { finding_id, severity: f.severity, title: f.title, disposition, verdict_issued_by_this_tool: false as const }, text: `${finding_id}: ${disposition.status}.` };
    },
  },
  {
    name: "lattice_get_record",
    title: "Get source-of-truth record",
    node: "LATTICE", scope: SCOPES.LATTICE,
    description: "Use this to retrieve one synthetic source-of-truth record with its provenance (evidence class, source reference, who recorded it and when) and any contradictions that involve it. Read-only.",
    input: z.object({ record_id: Id("REC") }).strict(),
    result: z.object({
      record: z.object({ id: z.string(), title: z.string(), value: z.string(), provenance: z.object({ evidence_class: Evidence, source_ref: z.string(), recorded_at: z.string(), recorded_by: z.string() }) }),
      contradictions: z.array(z.object({ id: z.string(), description: z.string(), status: z.string(), resolution_owner: z.string(), record_ids: z.array(z.string()) })),
    }),
    handler: ({ fx }, { record_id }) => {
      const r = fx.records.find((x) => x.id === record_id);
      if (!r) return notFound("record", record_id);
      const contradictions = fx.contradictions.filter((c) => c.record_ids.includes(record_id));
      return { ok: true, result: { record: { id: r.id, title: r.title, value: r.value, provenance: { evidence_class: r.evidence_class, source_ref: r.source_ref, recorded_at: r.recorded_at, recorded_by: r.recorded_by } }, contradictions }, text: `${r.id}: ${r.value} (${r.evidence_class})${contradictions.length ? `; contradicted in ${contradictions.map((c) => c.id).join(", ")}` : ""}.` };
    },
  },
  {
    name: "lattice_list_contradictions",
    title: "List contradictions",
    node: "LATTICE", scope: SCOPES.LATTICE,
    description: "Use this to list contradictions between synthetic source-of-truth records, with both sides and who owns the resolution. It does not resolve or overwrite either record.",
    input: z.object({ status: z.enum(["UNRESOLVED", "RESOLVED"]).optional() }).strict(),
    result: z.object({ contradictions: z.array(z.object({ id: z.string(), description: z.string(), status: z.string(), resolution_owner: z.string(), sides: z.array(z.object({ record_id: z.string(), value: z.string(), evidence_class: Evidence, source_ref: z.string() })) })) }),
    handler: ({ fx }, { status }) => {
      const contradictions = fx.contradictions.filter((c) => !status || c.status === status).map((c) => ({
        id: c.id, description: c.description, status: c.status, resolution_owner: c.resolution_owner,
        sides: c.record_ids.map((id) => fx.records.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r)
          .map((r) => ({ record_id: r.id, value: r.value, evidence_class: r.evidence_class, source_ref: r.source_ref })),
      }));
      return { ok: true, result: { contradictions }, text: `${contradictions.length} contradiction(s).` };
    },
  },
  {
    name: "lattice_verify_receipts",
    title: "Verify evidence receipts",
    node: "LATTICE", scope: SCOPES.LATTICE,
    description: "Use this to verify the hash chain of evidence receipts on this server and list the receipts created for the current signed-in user. Other users' receipts are counted in the chain check but never listed.",
    input: z.object({ receipt_id: z.string().regex(/^rcpt_[0-9a-f-]{36}$/).optional() }).strict(),
    result: z.object({
      chain: z.object({ valid: z.boolean(), checked: z.number().int(), first_invalid_sequence: z.number().int().nullable() }),
      receipts: z.array(z.object({ receipt_id: z.string(), sequence: z.number().int(), tool: z.string(), outcome: z.string(), invoked_at: z.string(), receipt_sha256: z.string() })),
    }),
    handler: ({ receiptsForSubject, verifyChain }, { receipt_id }) => {
      const mine = receiptsForSubject().filter((r) => !receipt_id || r.receipt_id === receipt_id);
      if (receipt_id && !mine.length) return notFound("receipt for this user", receipt_id);
      const chain = verifyChain();
      const receipts = mine.map((r) => ({ receipt_id: r.receipt_id, sequence: r.sequence, tool: r.tool, outcome: r.outcome, invoked_at: r.invoked_at, receipt_sha256: r.receipt_sha256 }));
      return { ok: true, result: { chain, receipts }, text: `Receipt chain ${chain.valid ? "valid" : "BROKEN"} across ${chain.checked} receipt(s); ${receipts.length} listed for you.` };
    },
  },
];
