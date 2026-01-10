const ORACLE_BASE = process.env.VITE_ORACLE_BASE_URL;

export async function oraclePing() {
  const res = await fetch(`${ORACLE_BASE}/oracle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction: "PING" }),
  });

  return res.json();
}

export async function oracleThothRoute(path: string, depth = 1) {
  const res = await fetch(`${ORACLE_BASE}/oracle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instruction: "THOTH_ROUTE",
      data: { path, depth },
    }),
  });

  return res.json();
}

