import { NextResponse } from 'next/server';
import { agentList } from '@/lib/agents';

export const dynamic = 'force-dynamic';

interface AgentHeartbeat {
  engine: string;
  status: string;
  timestamp: string;
  latency_ms: number;
  version: string;
  symbolic_depth: number;
}

async function fetchAgentHeartbeat(id: string, url: string) {
  try {
    const start = Date.now();
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    const latency_ms = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      id,
      status:            data.status === 'alive' ? 'nominal' as const : 'degraded' as const,
      last_heartbeat_ts: data.timestamp,
      symbolic_depth:    data.symbolic_depth ?? 0,
      latency_ms,
    };
  } catch {
    return {
      id,
      status:            'offline' as const,
      last_heartbeat_ts: null,
      symbolic_depth:    0,
      latency_ms:        null,
    };
  }
}

export async function GET() {
  const live    = agentList.filter(a => a.heartbeat_url);
  const static_ = agentList.filter(a => !a.heartbeat_url);

  const liveResults = await Promise.all(
    live.map(a => fetchAgentHeartbeat(a.id, a.heartbeat_url!))
  );

  const staticResults = static_.map(a => ({
    id:                a.id,
    status:            a.status,
    last_heartbeat_ts: null,
    symbolic_depth:    0,
    latency_ms:        null,
  }));

  return NextResponse.json({
    agents:     [...liveResults, ...staticResults],
    updated_at: new Date().toISOString(),
    version:    'RISING_STAR v1.1.1',
  });
}
