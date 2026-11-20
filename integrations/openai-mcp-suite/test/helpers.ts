import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createSuite, type SuiteOptions } from "../src/server.js";
import { DevIssuer } from "../src/dev-issuer.js";

export interface Harness {
  base: string; resource: string; issuer: DevIssuer; suite: ReturnType<typeof createSuite>; http: HttpServer;
  token: (scopes: string[], sub?: string) => Promise<string>;
  tokenWith: (scopes: string[], claims: Record<string, unknown>, sub?: string) => Promise<string>;
  client: (token: string) => Promise<Client>;
  close: () => Promise<void>;
}

export async function startHarness(extra: Partial<SuiteOptions> = {}): Promise<Harness> {
  const issuer = await DevIssuer.create();
  const http = createServer();
  await new Promise<void>((r) => http.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  const resource = `${base}/mcp`;
  const suite = createSuite({ auth: { resource, issuer: issuer.issuer, key: issuer.publicKey, publicBaseUrl: base }, ...extra });
  http.on("request", suite.app);
  const clients: Client[] = [];
  return {
    base, resource, issuer, suite, http,
    token: (scopes, sub) => issuer.mint({ audience: resource, scopes, sub }),
    tokenWith: (scopes, claims, sub) => issuer.mint({ audience: resource, scopes, sub, claims }),
    client: async (token) => {
      const c = new Client({ name: "synthetic-chatgpt-stand-in", version: "0.1.0" });
      await c.connect(new StreamableHTTPClientTransport(new URL(resource), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
      clients.push(c);
      return c;
    },
    close: async () => { for (const c of clients) await c.close(); await new Promise<void>((r) => http.close(() => r())); },
  };
}

export async function rpc(base: string, body: unknown, token?: string) {
  return fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}
