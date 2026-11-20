import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { startHarness, rpc, type Harness } from "./helpers.js";
import { SCOPES, ALL_SCOPES } from "../src/auth.js";
import { WIDGET_URIS } from "../src/tools.js";
import { loadWidgets, WIDGET_MIME } from "../src/widgets.js";

let h: Harness;
beforeAll(async () => { h = await startHarness(); });
afterAll(async () => { await h.close(); });

const call = async (token: string, name: string, args: Record<string, unknown> = {}, id = 1) => {
  const res = await rpc(h.base, { jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }, token);
  return (await res.json()).result;
};
const clientToken = (client: string, sub = `client-${client}`) => h.tokenWith([SCOPES.CLIENT], { mn_client_id: client }, sub);

describe("Engagement Desk: Operator view", () => {
  it("shows every synthetic engagement with internal notes and pending approvals, and links the Operator template", async () => {
    const op = await h.token([SCOPES.DESK_OPERATOR], "operator-1");
    const r = await call(op, "desk_get_operator_view");
    expect(r.isError).toBe(false);
    const ids = r.structuredContent.result.engagements.map((e: any) => e.id);
    expect(ids).toEqual(["ENG-SYN-001", "ENG-SYN-002"]);
    const e1 = r.structuredContent.result.engagements[0];
    expect(e1.internal_notes.length).toBeGreaterThan(0);
    expect(e1.pending_approvals.map((a: any) => a.approver_role)).toEqual(expect.arrayContaining(["OPERATOR", "THOTH", "CLIENT"]));
    expect(r.structuredContent.result.actions_available_here).toEqual([]);

    const list = await (await rpc(h.base, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, op)).json();
    const d = list.result.tools.find((t: any) => t.name === "desk_get_operator_view");
    expect(d._meta.ui.resourceUri).toBe(WIDGET_URIS.operator);
    expect(d._meta["openai/outputTemplate"]).toBe(WIDGET_URIS.operator);
    expect(d.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
  });
});

describe("Engagement Desk: client view is scoped to the signed-in client", () => {
  it("Client A sees only its own engagement, with no internal notes, THOTH or Operator records, or hidden items", async () => {
    const r = await call(await clientToken("CLI-SYN-A"), "client_get_engagement");
    expect(r.isError).toBe(false);
    const e = r.structuredContent.result.engagement;
    expect(e.id).toBe("ENG-SYN-001");
    expect(e.stage).toBe("In progress");
    expect(e.milestones.map((m: any) => m.id)).toEqual(["MS-SYN-001-1", "MS-SYN-001-2", "MS-SYN-001-4"]);
    expect(e.shared_evidence.map((v: any) => v.id)).toEqual(["EV-SYN-001-1"]);
    expect(e.waiting_on_you.map((a: any) => a.id)).toEqual(["AP-SYN-001-3"]);
    const raw = JSON.stringify(r);
    for (const leak of ["internal note", "THOTH", "OPERATOR", "AP-SYN-001-1", "AP-SYN-001-2", "EV-SYN-001-2", "MS-SYN-001-3", "CLI-SYN-B", "ENG-SYN-002", "fulfillment_started", "Synthetic Client A"]) {
      expect(raw).not.toContain(leak);
    }
  });

  it("asking for another client's engagement looks exactly like asking for one that does not exist", async () => {
    const a = await clientToken("CLI-SYN-A");
    const other = await call(a, "client_get_engagement", { engagement_id: "ENG-SYN-002" });
    const none = await call(a, "client_get_engagement", { engagement_id: "ENG-SYN-999" });
    for (const r of [other, none]) {
      expect(r.isError).toBe(true);
      expect(r.structuredContent).toMatchObject({ outcome: "unavailable", reason_codes: ["SOURCE_MISSING"], result: null });
    }
    const strip = (t: string) => t.replace(/ENG-SYN-\d+/g, "ID").replace(/Receipt \S+/, "");
    expect(strip(other.content[0].text)).toBe(strip(none.content[0].text));
  });

  it("Client B sees its own paused engagement as 'On hold', never the internal pause reason", async () => {
    const r = await call(await clientToken("CLI-SYN-B"), "client_get_engagement");
    expect(r.structuredContent.result.engagement).toMatchObject({ id: "ENG-SYN-002", stage: "On hold", waiting_on_you: [] });
    expect(JSON.stringify(r)).not.toMatch(/payment|paused|Resume/);
  });

  it("a client scope with no signed client binding gets nothing", async () => {
    const r = await call(await h.token([SCOPES.CLIENT], "unbound"), "client_get_engagement");
    expect(r.structuredContent).toMatchObject({ outcome: "unavailable", reason_codes: ["SOURCE_UNREADABLE"], result: null });
  });

  it("the binding is only read from the signed token, and a malformed binding is ignored", async () => {
    const bad = await h.tokenWith([SCOPES.CLIENT], { mn_client_id: "CLI-SYN-A' OR 1=1" }, "bad");
    expect((await call(bad, "client_get_engagement")).structuredContent.reason_codes).toEqual(["SOURCE_UNREADABLE"]);
    const injected = await call(await h.token([SCOPES.CLIENT], "x"), "client_get_engagement", { client_id: "CLI-SYN-A" });
    expect(injected.structuredContent).toMatchObject({ outcome: "unsupported", reason_codes: ["SCHEMA_UNSUPPORTED"] });
  });

  it("a client sign-in cannot reach the Operator view or the internal governance tools", async () => {
    const a = await clientToken("CLI-SYN-A");
    for (const name of ["desk_get_operator_view", "theia_get_workstream_status", "thoth_list_findings", "lattice_check_receipt_chain"]) {
      const r = await call(a, name, {});
      expect(r.structuredContent).toMatchObject({ outcome: "unavailable", reason_codes: ["SOURCE_UNREADABLE"], result: null });
    }
  });

  it("an Operator sign-in without the client binding cannot impersonate a client", async () => {
    const r = await call(await h.token(ALL_SCOPES, "operator-all"), "client_get_engagement", { engagement_id: "ENG-SYN-001" });
    expect(r.structuredContent.reason_codes).toEqual(["SOURCE_UNREADABLE"]);
  });
});

describe("widget templates", () => {
  const listRes = async (token: string) => (await (await rpc(h.base, { jsonrpc: "2.0", id: 9, method: "resources/list", params: {} }, token)).json()).result.resources;
  const readRes = async (token: string, uri: string) => (await (await rpc(h.base, { jsonrpc: "2.0", id: 10, method: "resources/read", params: { uri } }, token)).json());

  it("are listed and readable only with the matching scope, as MCP Apps HTML with no external domains", async () => {
    const a = await clientToken("CLI-SYN-A");
    expect((await listRes(a)).map((r: any) => r.uri)).toEqual([WIDGET_URIS.client]);
    const denied = await readRes(a, WIDGET_URIS.operator);
    expect(denied.error).toBeTruthy();
    expect(JSON.stringify(denied)).not.toContain("Internal notes");
    const ok = await readRes(a, WIDGET_URIS.client);
    const c = ok.result.contents[0];
    expect(c.mimeType).toBe(WIDGET_MIME);
    expect(c._meta.ui.csp).toEqual({ connectDomains: [], resourceDomains: [] });
    const op = await h.token([SCOPES.DESK_OPERATOR]);
    expect((await listRes(op)).map((r: any) => r.uri)).toEqual([WIDGET_URIS.operator]);
  });

  it("contain no innerHTML, network calls, storage or external sources", () => {
    const dir = resolve(import.meta.dirname, "../widgets");
    for (const f of readdirSync(dir)) {
      const src = readFileSync(resolve(dir, f), "utf8");
      expect(src).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|\bsrc=["']?https?:|href=["']?https?:/);
    }
  });

  const render = (html: string, setup?: (w: any) => void) => {
    const dom = new JSDOM(html, { runScripts: "dangerously", beforeParse: (w) => setup?.(w) });
    return dom;
  };

  it("render the client view from window.openai.toolOutput and treat hostile text as text", async () => {
    const r = await call(await clientToken("CLI-SYN-A"), "client_get_engagement");
    const env = structuredClone(r.structuredContent);
    env.result.engagement.milestones[0].title = '<img src=x onerror="window.__pwned=1">';
    const html = loadWidgets().find((w) => w.uri === WIDGET_URIS.client)!.html;
    const dom = render(html, (w) => { w.openai = { toolOutput: env }; });
    const doc = dom.window.document;
    expect(doc.querySelector("img")).toBeNull();
    expect((dom.window as any).__pwned).toBeUndefined();
    expect(doc.body.textContent).toContain('<img src=x onerror="window.__pwned=1">');
    expect(doc.body.textContent).toContain("Status: In progress");
    expect(doc.body.textContent).toContain("Client acceptance of deliverable");
    dom.window.close();
  });

  it("render the Operator view from the MCP Apps postMessage notification, and ignore messages from other senders", async () => {
    const r = await call(await h.token([SCOPES.DESK_OPERATOR]), "desk_get_operator_view");
    const html = loadWidgets().find((w) => w.uri === WIDGET_URIS.operator)!.html;
    const dom = render(html);
    const w = dom.window as any;
    const msg = { jsonrpc: "2.0", method: "ui/notifications/tool-result", params: { structuredContent: r.structuredContent } };
    w.dispatchEvent(new w.MessageEvent("message", { data: msg, source: null }));
    expect(w.document.body.textContent).toContain("Waiting for data.");
    w.dispatchEvent(new w.MessageEvent("message", { data: msg, source: w.parent }));
    const text = w.document.body.textContent;
    expect(text).toContain("ENG-SYN-002");
    expect(text).toContain("Internal notes");
    expect(text).toContain("record outside ChatGPT");
    expect(w.document.querySelectorAll("button, form, input").length).toBe(0);
    dom.window.close();
  });

  it("opens the MCP Apps handshake with ui/initialize and confirms with ui/notifications/initialized only after the host answers", () => {
    const html = loadWidgets().find((w) => w.uri === WIDGET_URIS.client)!.html;
    const sent: any[] = [];
    const dom = new JSDOM(html, { runScripts: "dangerously", beforeParse: (w: any) => {
      const fakeParent = { postMessage: (m: unknown) => sent.push(m) };
      Object.defineProperty(w, "parent", { get: () => fakeParent });
    } });
    const w = dom.window as any;
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ jsonrpc: "2.0", method: "ui/initialize", params: { appInfo: { name: "mirrornode-engagement-desk" }, appCapabilities: {}, protocolVersion: expect.any(String) } });
    const id = sent[0].id;
    // A reply from another window is ignored.
    w.dispatchEvent(new w.MessageEvent("message", { data: { jsonrpc: "2.0", id, result: {} }, source: null }));
    expect(sent).toHaveLength(1);
    w.dispatchEvent(new w.MessageEvent("message", { data: { jsonrpc: "2.0", id, result: { protocolVersion: "2026-01-26", hostInfo: { name: "host", version: "1" }, hostCapabilities: {}, hostContext: {} } }, source: w.parent }));
    w.dispatchEvent(new w.MessageEvent("message", { data: { jsonrpc: "2.0", id, result: {} }, source: w.parent }));
    expect(sent).toHaveLength(2);
    expect(sent[1]).toEqual({ jsonrpc: "2.0", method: "ui/notifications/initialized", params: {} });
    dom.window.close();
  });

  it("the client template refuses to render Operator data even if handed it", async () => {
    const r = await call(await h.token([SCOPES.DESK_OPERATOR]), "desk_get_operator_view");
    const html = loadWidgets().find((w) => w.uri === WIDGET_URIS.client)!.html;
    const dom = render(html, (w) => { w.openai = { toolOutput: r.structuredContent }; });
    expect(dom.window.document.body.textContent).toContain("Wrong view for this data.");
    expect(dom.window.document.body.textContent).not.toContain("Synthetic internal note");
    dom.window.close();
  });
});
