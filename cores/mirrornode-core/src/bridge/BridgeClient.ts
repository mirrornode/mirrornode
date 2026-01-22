/**
 * TypeScript client for MIRRORNODE FastAPI Bridge
 * Maps canonical MirrorNodeEvent types to Python bridge format
 */

export interface BridgeEvent {
  id?: string;
  ts?: string;
  node: string;
  kind: string;
  payload: Record<string, any>;
}

export interface BridgeResponse {
  ok: boolean;
  stored?: BridgeEvent;
  events?: BridgeEvent[];
  count?: number;
}

export interface BridgeHealthResponse {
  ok: boolean;
  events: number;
  clients: number;
}

export class BridgeClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:8420") {
    this.baseUrl = baseUrl;
  }

  async health(): Promise<BridgeHealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`Bridge health check failed: ${res.statusText}`);
    return res.json();
  }

  async postEvent(event: BridgeEvent): Promise<BridgeResponse> {
    const res = await fetch(`${this.baseUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`Failed to post event: ${res.statusText}`);
    return res.json();
  }

  async getRecent(limit: number = 20): Promise<BridgeResponse> {
    const res = await fetch(`${this.baseUrl}/events/recent?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to get recent events: ${res.statusText}`);
    return res.json();
  }
}
