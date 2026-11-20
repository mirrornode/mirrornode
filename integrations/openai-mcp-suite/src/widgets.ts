import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WIDGET_URIS } from "./tools.js";
import { SCOPES } from "./auth.js";

/** MCP Apps widget MIME type (RESOURCE_MIME_TYPE in @modelcontextprotocol/ext-apps). */
export const WIDGET_MIME = "text/html;profile=mcp-app";

function widgetsDir(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 4; i++) {
    const c = resolve(dir, "widgets");
    if (existsSync(resolve(c, "_bridge.js"))) return c;
    dir = resolve(dir, "..");
  }
  throw new Error("widgets directory not found");
}

export interface WidgetResource { uri: string; name: string; title: string; scope: string; html: string }

export function loadWidgets(): WidgetResource[] {
  const dir = widgetsDir();
  const bridge = readFileSync(resolve(dir, "_bridge.js"), "utf8");
  const read = (f: string) => readFileSync(resolve(dir, f), "utf8").replace("/*__MN_BRIDGE__*/", () => bridge);
  return [
    { uri: WIDGET_URIS.operator, name: "engagement-desk-operator", title: "Engagement Desk (Operator)", scope: SCOPES.DESK_OPERATOR, html: read("engagement-desk-operator.html") },
    { uri: WIDGET_URIS.client, name: "engagement-desk-client", title: "Your engagement", scope: SCOPES.CLIENT, html: read("engagement-desk-client.html") },
  ];
}

/** Widget-level metadata: no external domains at all. */
export const WIDGET_META = { ui: { csp: { connectDomains: [] as string[], resourceDomains: [] as string[] }, prefersBorder: true } };
