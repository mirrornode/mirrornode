export type BridgeEvent = {
  kind: string;
  node: string;
  payload?: any;
  ts?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_MIRRORNODE_API || "";

export async function getRecentEvents(): Promise<BridgeEvent[]> {
  const res = await fetch(`${API_BASE}/events/recent`);
  if (!res.ok) {
    throw new Error(`events/recent failed: ${res.status}`);
  }
  return res.json();
}

