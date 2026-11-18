import { createSuite } from "./server.js";
import { DevIssuer } from "./dev-issuer.js";
import { ALL_SCOPES } from "./auth.js";

/**
 * Local, isolated runner. Binds to loopback only and uses the in-memory dev
 * issuer. There is no production configuration in this slice by design.
 */
const listenPort = Number(process.env.SUITE_LISTEN ?? "0");
const host = "127.0.0.1";

const issuer = await DevIssuer.create();
const placeholderBase = "http://127.0.0.1";
let suite = createSuite({ auth: { resource: `${placeholderBase}/mcp`, issuer: issuer.issuer, key: issuer.publicKey, publicBaseUrl: placeholderBase } });
const httpServer = suite.app.listen(listenPort, host, async () => {
  const addr = httpServer.address();
  const actual = typeof addr === "object" && addr ? addr.port : listenPort;
  const base = `http://${host}:${actual}`;
  // Rebuild with the real loopback URL so aud/resource match exactly.
  suite = createSuite({ auth: { resource: `${base}/mcp`, issuer: issuer.issuer, key: issuer.publicKey, publicBaseUrl: base } });
  httpServer.removeAllListeners("request");
  httpServer.on("request", suite.app);
  const token = await issuer.mint({ audience: `${base}/mcp`, scopes: ALL_SCOPES, ttlSeconds: 900 });
  console.log(`SYNTHETIC suite listening on ${base}/mcp`);
  console.log(`Dev token (synthetic, 15 min, loopback only):\n${token}`);
});
