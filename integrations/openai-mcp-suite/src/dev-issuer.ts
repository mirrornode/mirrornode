import { generateKeyPair, SignJWT, type KeyLike } from "jose";

/**
 * In-memory test issuer for local, isolated runs only. It is NOT an OAuth
 * authorization server: it has no authorize/token endpoints, no PKCE and no
 * client registration. It only mints signed JWTs so the resource-server path
 * (signature, iss, aud, exp, scope) can be exercised end to end.
 */
export class DevIssuer {
  private constructor(public readonly issuer: string, private readonly privateKey: KeyLike, public readonly publicKey: KeyLike) {}

  static async create(issuer = "https://issuer.synthetic.invalid"): Promise<DevIssuer> {
    const { privateKey, publicKey } = await generateKeyPair("ES256");
    return new DevIssuer(issuer, privateKey, publicKey);
  }

  async mint(opts: { audience: string; scopes: string[]; sub?: string; clientId?: string; ttlSeconds?: number; issuer?: string; notBefore?: number }): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const jwt = new SignJWT({ scope: opts.scopes.join(" "), client_id: opts.clientId ?? "synthetic-client" })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuer(opts.issuer ?? this.issuer)
      .setAudience(opts.audience)
      .setSubject(opts.sub ?? "synthetic-user-001")
      .setIssuedAt(now)
      .setExpirationTime(now + (opts.ttlSeconds ?? 300));
    if (opts.notBefore !== undefined) jwt.setNotBefore(opts.notBefore);
    return jwt.sign(this.privateKey);
  }
}
