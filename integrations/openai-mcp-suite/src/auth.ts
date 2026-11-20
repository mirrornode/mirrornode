import { jwtVerify, type JWTVerifyGetKey, type KeyLike } from "jose";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export const SCOPES = {
  THEIA: "suite:theia.read",
  PTAH: "suite:ptah.read",
  THOTH: "suite:thoth.read",
  LATTICE: "suite:lattice.read",
  /** Operator-only Engagement Desk (Phase B). */
  DESK_OPERATOR: "suite:desk.operator",
  /** Client-facing, project-scoped view (Phase C). Requires an mn_client_id claim. */
  CLIENT: "client:engagement.read",
} as const;
export const ALL_SCOPES = Object.values(SCOPES);

export interface AuthConfig {
  /** RFC 8707 resource identifier of this MCP server, e.g. https://suite.example/mcp */
  resource: string;
  /** Issuer of the authorization server (must match the token's iss). */
  issuer: string;
  /** Verification key or JWKS resolver for the authorization server. */
  key: KeyLike | Uint8Array | JWTVerifyGetKey;
  /** Public base URL of this server, used for the protected-resource metadata URL. */
  publicBaseUrl: string;
}

export class AuthError extends Error {
  constructor(public readonly code: "invalid_token" | "insufficient_scope", message: string) { super(message); }
}

export function resourceMetadataUrl(cfg: AuthConfig): string {
  return new URL("/.well-known/oauth-protected-resource", cfg.publicBaseUrl).toString();
}

/** RFC 9728 protected resource metadata. */
export function protectedResourceMetadata(cfg: AuthConfig) {
  return {
    resource: cfg.resource,
    authorization_servers: [cfg.issuer],
    scopes_supported: ALL_SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "MIRRORNODE suite (synthetic slice)",
  };
}

export function wwwAuthenticate(cfg: AuthConfig, error?: { code: string; description: string; scope?: string }): string {
  const parts = [`Bearer resource_metadata="${resourceMetadataUrl(cfg)}"`];
  if (error) {
    parts.push(`error="${error.code}"`, `error_description="${error.description.replace(/"/g, "'")}"`);
    if (error.scope) parts.push(`scope="${error.scope}"`);
  }
  return parts.join(", ");
}

/**
 * Validates a bearer token on every request: signature, iss, aud (must equal
 * this server's resource), exp/nbf (30s skew) and presence of a scope claim.
 */
export async function verifyBearer(cfg: AuthConfig, header: string | undefined): Promise<AuthInfo> {
  if (!header || !/^Bearer\s+\S+$/i.test(header)) throw new AuthError("invalid_token", "Missing bearer token");
  const token = header.replace(/^Bearer\s+/i, "");
  let payload;
  try {
    ({ payload } = await jwtVerify(token, cfg.key as KeyLike, {
      issuer: cfg.issuer,
      audience: cfg.resource,
      algorithms: ["ES256", "RS256"],
      clockTolerance: 30,
      requiredClaims: ["exp", "sub"],
    }));
  } catch (e) {
    throw new AuthError("invalid_token", `Token rejected: ${(e as Error).name}`);
  }
  const scopes = typeof payload.scope === "string" ? payload.scope.split(" ").filter(Boolean) : [];
  return {
    token,
    clientId: String(payload.client_id ?? payload.azp ?? "unknown"),
    scopes,
    expiresAt: payload.exp,
    resource: new URL(cfg.resource),
    extra: {
      sub: String(payload.sub),
      // Client binding comes only from the signed token, never from tool input.
      clientBinding: typeof payload.mn_client_id === "string" && /^CLI-[A-Z0-9-]{1,40}$/.test(payload.mn_client_id) ? payload.mn_client_id : null,
    },
  };
}
