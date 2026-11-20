import { z } from "zod/v4";
import type { Fixtures } from "./fixtures.js";
import type { Receipt } from "./receipts.js";
import { SCOPES } from "./auth.js";

type Node = "THEIA" | "PTAH" | "THOTH" | "LATTICE" | "DESK";

export interface ToolContext {
  fx: Fixtures;
  subjectSha256: string;
  receiptsForSubject: () => Receipt[];
  verifyChain: () => { consistent: boolean; checked: number; first_mismatch_sequence: number | null };
  /** Client id bound by the signed token (mn_client_id), or null. Never taken from tool input. */
  clientBinding: string | null;
}
/** CG-0032 §12 outcome vocabulary and reason codes. */
export type Outcome = "success" | "partial" | "unavailable" | "failed" | "unsupported";
export type Completeness = "complete" | "partial" | "not-applicable";
export type ReasonCode = "SOURCE_MISSING" | "SOURCE_UNREADABLE" | "SOURCE_MALFORMED" | "SCHEMA_UNSUPPORTED" | "INTEGRITY_MISMATCH" | "SCAN_INCOMPLETE" | "SOURCE_STALE" | "MCP_INTERNAL_ERROR";
export const OUTCOMES = ["success", "partial", "unavailable", "failed", "unsupported"] as const;
export const COMPLETENESS = ["complete", "partial", "not-applicable"] as const;
export const REASON_CODES = ["SOURCE_MISSING", "SOURCE_UNREADABLE", "SOURCE_MALFORMED", "SCHEMA_UNSUPPORTED", "INTEGRITY_MISMATCH", "SCAN_INCOMPLETE", "SOURCE_STALE", "MCP_INTERNAL_ERROR"] as const;

export type HandlerResult =
  | { ok: true; result: unknown; text: string; outcome?: Outcome; completeness?: Completeness; reason_codes?: ReasonCode[] }
  | { ok: false; outcome: Outcome; completeness: Completeness; reason_codes: ReasonCode[]; message: string };

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  node: Node;
  scope: string;
  input: z.ZodObject;
  result: z.ZodType;
  handler: (ctx: ToolContext, input: any) => HandlerResult;
  /** MCP Apps template this tool renders into, if any. Only render tools carry one. */
  widget?: { uri: string; audience: "operator" | "client" };
}

const Id = (prefix: string) => z.string().regex(new RegExp(`^${prefix}-[A-Z0-9-]{1,40}$`)).describe(`Identifier starting with ${prefix}-`);
const Evidence = z.enum(["OBSERVED", "REPORTED", "INFERRED", "BLOCKED", "UNKNOWN"]);
const GateOut = z.strictObject({ id: z.string(), description: z.string(), owner_role: z.string(), state: z.enum(["OPEN", "CLOSED"]), evidence_class: Evidence, evidence_ref: z.string().nullable() });
const ActionOut = z.strictObject({
  id: z.string(), description: z.string(), required_authority: z.string(), reversible: z.boolean(),
  blocked_by_open_gates: z.array(z.string()),
  state: z.enum(["UNBLOCKED", "BLOCKED"]),
  operator_approval_required: z.boolean(),
  executable_by_this_server: z.literal(false),
});
const DispositionStatus = z.enum(["HOLD", "CLEARED", "CLEARED_WITH_CONDITIONS", "PENDING_THOTH_REVIEW"]);

const notFound = (what: string, id: string): HandlerResult => ({ ok: false, outcome: "unavailable", completeness: "not-applicable", reason_codes: ["SOURCE_MISSING"], message: `No synthetic ${what} with id ${id}.` });

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
const DispositionOut = z.strictObject({ status: DispositionStatus, recorded_by: z.string().nullable(), recorded_at: z.string().nullable(), clearance_requirements: z.array(z.string()) });

export const TOOLS: ToolDef[] = [
  {
    name: "theia_get_workstream_status",
    title: "Get workstream status",
    node: "THEIA", scope: SCOPES.THEIA,
    description: "Use this to read the current status and gates of a MIRRORNODE workstream from the synthetic fixture set. Returns each gate with its owner role, open/closed state and evidence class. Read-only; it changes nothing.",
    input: z.strictObject({ workstream_id: Id("WS").optional().describe("Workstream id. Omit to list all workstreams.") } ),
    result: z.strictObject({ workstreams: z.array(z.strictObject({ id: z.string(), title: z.string(), status: z.string(), summary: z.string(), gates: z.array(GateOut), open_gate_count: z.number().int() })) }),
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
    input: z.strictObject({ workstream_id: Id("WS") } ),
    result: z.strictObject({ workstream_id: z.string(), actions: z.array(ActionOut) }),
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
    input: z.strictObject({ workstream_id: Id("WS"), to: z.enum(["THEIA", "PTAH", "THOTH", "LATTICE", "OPERATOR"]) } ),
    result: z.strictObject({
      handoff: z.strictObject({
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
    input: z.strictObject({ component_id: Id("CMP") } ),
    result: z.strictObject({
      component_id: z.string(), title: z.string(), readiness: z.string(),
      evidence: z.array(z.strictObject({ claim: z.string(), evidence_class: Evidence, ref: z.string() })),
      unverified_claims: z.array(z.string()),
      open_findings: z.array(z.strictObject({ id: z.string(), severity: z.string(), title: z.string(), disposition_status: DispositionStatus })),
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
    input: z.strictObject({ finding_id: Id("FND") } ),
    result: z.strictObject({
      finding_id: z.string(),
      proposal: z.strictObject({
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
    input: z.strictObject({
      severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]).optional(),
      disposition_status: DispositionStatus.optional(),
    } ),
    result: z.strictObject({ findings: z.array(z.strictObject({ id: z.string(), severity: z.string(), component_id: z.string(), title: z.string(), evidence_class: Evidence, disposition_status: DispositionStatus })), holds: z.array(z.string()) }),
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
    input: z.strictObject({ finding_id: Id("FND") } ),
    result: z.strictObject({ finding_id: z.string(), severity: z.string(), title: z.string(), disposition: DispositionOut, verdict_issued_by_this_tool: z.literal(false) }),
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
    description: "Use this to retrieve one synthetic source-of-truth record with its attribution (evidence class, cited source, who recorded it and when) and any contradictions that involve it. Attribution says where a record says it came from; it does not establish that the record is true or approved. Read-only.",
    input: z.strictObject({ record_id: Id("REC") } ),
    result: z.strictObject({
      record: z.strictObject({ id: z.string(), title: z.string(), value: z.string(), attribution: z.strictObject({ evidence_class: Evidence, source_ref: z.string(), recorded_at: z.string(), recorded_by: z.string() }) }),
      contradictions: z.array(z.strictObject({ id: z.string(), description: z.string(), status: z.string(), resolution_owner: z.string(), record_ids: z.array(z.string()) })),
    }),
    handler: ({ fx }, { record_id }) => {
      const r = fx.records.find((x) => x.id === record_id);
      if (!r) return notFound("record", record_id);
      const contradictions = fx.contradictions.filter((c) => c.record_ids.includes(record_id));
      return { ok: true, result: { record: { id: r.id, title: r.title, value: r.value, attribution: { evidence_class: r.evidence_class, source_ref: r.source_ref, recorded_at: r.recorded_at, recorded_by: r.recorded_by } }, contradictions }, text: `${r.id}: ${r.value} (${r.evidence_class})${contradictions.length ? `; contradicted in ${contradictions.map((c) => c.id).join(", ")}` : ""}.` };
    },
  },
  {
    name: "lattice_list_contradictions",
    title: "List contradictions",
    node: "LATTICE", scope: SCOPES.LATTICE,
    description: "Use this to list contradictions between synthetic source-of-truth records, with both sides and who owns the resolution. It does not resolve or overwrite either record.",
    input: z.strictObject({ status: z.enum(["UNRESOLVED", "RESOLVED"]).optional() } ),
    result: z.strictObject({ contradictions: z.array(z.strictObject({ id: z.string(), description: z.string(), status: z.string(), resolution_owner: z.string(), sides: z.array(z.strictObject({ record_id: z.string(), value: z.string(), evidence_class: Evidence, source_ref: z.string() })) })) }),
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
    name: "lattice_check_receipt_chain",
    title: "Check receipt hash chain",
    node: "LATTICE", scope: SCOPES.LATTICE,
    description: "Use this to recompute the hash chain of evidence receipts on this server and list receipts created for the current signed-in user. A consistent chain means each stored receipt matches its recorded hash and link; it does not establish that any result was true, approved or authorized. Other users' receipts are counted but never listed.",
    input: z.strictObject({ receipt_id: z.string().regex(/^rcpt_[0-9a-f-]{36}$/).optional() }),
    result: z.strictObject({
      chain: z.strictObject({
        hash_chain_consistent: z.boolean(), checked: z.number().int(), first_mismatch_sequence: z.number().int().nullable(),
        semantics: z.literal("Hash and link recomputation only. Not a truth, approval or authorization claim."),
      }),
      receipts: z.array(z.strictObject({ receipt_id: z.string(), sequence: z.number().int(), tool: z.string(), outcome: z.enum(OUTCOMES), reason_codes: z.array(z.enum(REASON_CODES)), invoked_at: z.string(), receipt_sha256: z.string() })),
    }),
    handler: ({ receiptsForSubject, verifyChain }, { receipt_id }) => {
      const mine = receiptsForSubject().filter((r) => !receipt_id || r.receipt_id === receipt_id);
      if (receipt_id && !mine.length) return notFound("receipt for this user", receipt_id);
      const v = verifyChain();
      const chain = { hash_chain_consistent: v.consistent, checked: v.checked, first_mismatch_sequence: v.first_mismatch_sequence, semantics: "Hash and link recomputation only. Not a truth, approval or authorization claim." as const };
      const receipts = mine.map((r) => ({ receipt_id: r.receipt_id, sequence: r.sequence, tool: r.tool, outcome: r.outcome, reason_codes: r.reason_codes, invoked_at: r.invoked_at, receipt_sha256: r.receipt_sha256 }));
      const text = `Receipt hash chain ${v.consistent ? "consistent" : "MISMATCH"} across ${v.checked} receipt(s); ${receipts.length} listed for you.`;
      return v.consistent
        ? { ok: true, result: { chain, receipts }, text }
        : { ok: true, result: { chain, receipts }, text, outcome: "failed", completeness: "complete", reason_codes: ["INTEGRITY_MISMATCH"] };
    },
  },
];

const CustodyStage = z.enum(["intake_pending", "intake_complete", "fulfillment_started", "paused", "delivered", "refunded"]);
const MilestoneOut = z.strictObject({ id: z.string(), title: z.string(), state: z.enum(["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"]) });
/** Client-safe wording for the Osiris custody stage; internal state names stay on the Operator side. */
const CLIENT_STAGE_LABEL: Record<z.infer<typeof CustodyStage>, string> = {
  intake_pending: "Waiting for your intake form",
  intake_complete: "Intake received",
  fulfillment_started: "In progress",
  paused: "On hold",
  delivered: "Delivered",
  refunded: "Closed",
};
export const WIDGET_URIS = { operator: "ui://mirrornode/engagement-desk-operator.html", client: "ui://mirrornode/engagement-desk-client.html" } as const;

export const DESK_TOOLS: ToolDef[] = [
  {
    name: "desk_get_operator_view",
    title: "Engagement Desk: Operator view",
    node: "DESK", scope: SCOPES.DESK_OPERATOR,
    widget: { uri: WIDGET_URIS.operator, audience: "operator" },
    description: "Operator only. Use this to show the internal Engagement Desk across synthetic engagements: custody stage, milestones, evidence, pending approvals and internal notes. Pending approvals are listed for the Operator to record elsewhere; this tool cannot approve, release, send or change anything.",
    input: z.strictObject({ client_id: z.string().regex(/^CLI-[A-Z0-9-]{1,40}$/).optional() }),
    result: z.strictObject({
      audience: z.literal("operator"),
      engagements: z.array(z.strictObject({
        id: z.string(), client_id: z.string(), client_label: z.string(), offer: z.string(), custody_stage: CustodyStage,
        milestones: z.array(MilestoneOut.extend({ client_visible: z.boolean() })),
        evidence: z.array(z.strictObject({ id: z.string(), title: z.string(), evidence_class: Evidence, client_visible: z.boolean() })),
        pending_approvals: z.array(z.strictObject({ id: z.string(), title: z.string(), approver_role: z.enum(["OPERATOR", "CLIENT", "THOTH"]) })),
        internal_notes: z.array(z.string()),
      })),
      actions_available_here: z.array(z.never()).max(0),
    }),
    handler: ({ fx }, { client_id }) => {
      const list = fx.engagements.filter((e) => !client_id || e.client_id === client_id).map((e) => ({
        id: e.id, client_id: e.client_id, client_label: e.client_label, offer: e.offer, custody_stage: e.custody_stage,
        milestones: e.milestones.map((m) => ({ id: m.id, title: m.title, state: m.state, client_visible: m.client_visible })),
        evidence: e.evidence.map((v) => ({ id: v.id, title: v.title, evidence_class: v.evidence_class, client_visible: v.client_visible })),
        pending_approvals: e.approvals.filter((a) => a.state === "PENDING").map((a) => ({ id: a.id, title: a.title, approver_role: a.approver_role })),
        internal_notes: e.internal_notes,
      }));
      const pending = list.reduce((n, e) => n + e.pending_approvals.length, 0);
      return { ok: true, result: { audience: "operator", engagements: list, actions_available_here: [] }, text: `${list.length} synthetic engagement(s), ${pending} pending approval(s). Nothing can be approved from this view.` };
    },
  },
  {
    name: "client_get_engagement",
    title: "My engagement status",
    node: "DESK", scope: SCOPES.CLIENT,
    widget: { uri: WIDGET_URIS.client, audience: "client" },
    description: "Use this to show the signed-in client the status of their own engagement: stage, milestones, shared evidence and what is waiting on them. It only ever returns the engagement bound to the client's sign-in; it shows no internal notes, security records or other clients.",
    input: z.strictObject({ engagement_id: Id("ENG").optional() }),
    result: z.strictObject({
      audience: z.literal("client"),
      engagement: z.strictObject({
        id: z.string(), offer: z.string(), stage: z.string(),
        milestones: z.array(MilestoneOut),
        shared_evidence: z.array(z.strictObject({ id: z.string(), title: z.string() })),
        waiting_on_you: z.array(z.strictObject({ id: z.string(), title: z.string() })),
      }),
    }),
    handler: ({ fx, clientBinding }, { engagement_id }) => {
      if (!clientBinding) return { ok: false, outcome: "unavailable", completeness: "not-applicable", reason_codes: ["SOURCE_UNREADABLE"], message: "This sign-in is not bound to a client engagement." };
      const mine = fx.engagements.filter((e) => e.client_id === clientBinding);
      // Another client's id and an unknown id get the same answer, so existence is not revealed.
      const e = engagement_id ? mine.find((x) => x.id === engagement_id) : mine[0];
      if (!e) return notFound("engagement for this sign-in", engagement_id ?? "(default)");
      const engagement = {
        id: e.id, offer: e.offer, stage: CLIENT_STAGE_LABEL[e.custody_stage],
        milestones: e.milestones.filter((m) => m.client_visible).map((m) => ({ id: m.id, title: m.title, state: m.state })),
        shared_evidence: e.evidence.filter((v) => v.client_visible).map((v) => ({ id: v.id, title: v.title })),
        waiting_on_you: e.approvals.filter((a) => a.client_visible && a.approver_role === "CLIENT" && a.state === "PENDING").map((a) => ({ id: a.id, title: a.title })),
      };
      return { ok: true, result: { audience: "client", engagement }, text: `${e.id}: ${engagement.stage}; ${engagement.waiting_on_you.length} item(s) waiting on you.` };
    },
  },
];

export const ALL_TOOLS: ToolDef[] = [...TOOLS, ...DESK_TOOLS];
