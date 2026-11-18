import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { SignJWT } from "jose";
import { startHarness, rpc, type Harness } from "./helpers.js";
import { ALL_SCOPES } from "../src/auth.js";
import { DevIssuer } from "../src/dev-issuer.js";

let h: Harness;
beforeAll(async () => { h = await startHarness(); });
afterAll(async () => { await h.close(); });

const init = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } } };

describe("OAuth resource-server behavior", () => {
  it("serves RFC 9728 protected resource metadata", async () => {
    for (const path of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]) {
      const m = await (await fetch(h.base + path)).json();
      expect(m.resource).toBe(h.resource);
      expect(m.authorization_servers).toEqual([h.issuer.issuer]);
      expect(m.scopes_supported).toEqual(ALL_SCOPES);
    }
  });

  it("answers 401 with a resource_metadata challenge when no token is sent", async () => {
    const res = await rpc(h.base, init);
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe(`Bearer resource_metadata="${h.base}/.well-known/oauth-protected-resource"`);
  });

  const rejects: Array<[string, () => Promise<string>]> = [
    ["wrong audience", () => h.issuer.mint({ audience: "https://other.example/mcp", scopes: ALL_SCOPES })],
    ["wrong issuer", () => h.issuer.mint({ audience: h.resource, scopes: ALL_SCOPES, issuer: "https://evil.example" })],
    ["expired", () => h.issuer.mint({ audience: h.resource, scopes: ALL_SCOPES, ttlSeconds: -120 })],
    ["not yet valid", () => h.issuer.mint({ audience: h.resource, scopes: ALL_SCOPES, notBefore: Math.floor(Date.now() / 1000) + 600 })],
    ["signed by another key", async () => (await DevIssuer.create(h.issuer.issuer)).mint({ audience: h.resource, scopes: ALL_SCOPES })],
    ["tampered payload", async () => { const [a, , c] = (await h.token(ALL_SCOPES)).split("."); return [a, Buffer.from(JSON.stringify({ sub: "x", aud: h.resource, iss: h.issuer.issuer, exp: 9999999999, scope: ALL_SCOPES.join(" ") })).toString("base64url"), c].join("."); }],
    ["alg none", async () => new SignJWT({ scope: ALL_SCOPES.join(" ") }).setProtectedHeader({ alg: "none" } as any).setAudience(h.resource).setIssuer(h.issuer.issuer).setSubject("x").setExpirationTime("5m").sign(new Uint8Array(32)).catch(() => "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.")],
    ["garbage", async () => "not-a-jwt"],
  ];
  for (const [label, make] of rejects) {
    it(`rejects a token: ${label}`, async () => {
      const res = await rpc(h.base, init, await make());
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toMatch(/^Bearer resource_metadata=".+", error="invalid_token", error_description=".+"$/);
    });
  }

  it("accepts a valid token", async () => {
    const res = await rpc(h.base, init, await h.token(ALL_SCOPES));
    expect(res.status).toBe(200);
  });

  it("rejects GET and DELETE on the stateless endpoint", async () => {
    expect((await fetch(`${h.base}/mcp`)).status).toBe(405);
    expect((await fetch(`${h.base}/mcp`, { method: "DELETE" })).status).toBe(405);
  });

  it("caps request bodies", async () => {
    const res = await rpc(h.base, { ...init, params: { ...init.params, pad: "x".repeat(70_000) } }, await h.token(ALL_SCOPES));
    expect(res.status).toBe(413);
  });
});
