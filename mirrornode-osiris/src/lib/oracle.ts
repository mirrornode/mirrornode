// src/lib/oracle.ts
// Canonical Oracle client for Osiris HUD (local-first, auth enforced)

type OraclePayload = Record<string, unknown>;

const ORACLE_BASE =
  import.meta.env.VITE_ORACLE_BASE_URL ??
  (import.meta.env as any).VITEORACLEBASEURL;

if (!ORACLE_BASE) {
  throw new Error("ORACLE_BASE URL is not defined in environment");
}

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_API_KEY is not defined in environment");
}

// -----------------------------
// Internal helper
// -----------------------------
async function postJSON<T>(
  path: string,
  body: OraclePayload
): Promise<T> {
  const res = await fetch(`${ORACLE_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Oracle request failed (${res.status} ${res.statusText}): ${text}`
    );
  }

  return res.json() as Promise<T>;
}

// -----------------------------
// Existing Oracle calls
// -----------------------------
export async function oraclePing(): Promise<unknown> {
  return postJSON("/oracle", {
    mode: "ping",
    prompt: "ping",
    ritualState: "open",
    sessionId: "osiris-hud",
  });
}

export async function oracleRoute(payload: OraclePayload): 
Promise<unknown> {
  return postJSON("/oracle", payload);
}

// -----------------------------
// NEW: Audit submission
// -----------------------------
export async function submitAudit(
  event: string,
  pipeline_config: unknown
): Promise<unknown> {
  return postJSON("/audit", {
    event,
    pipeline_config,
  });
}

