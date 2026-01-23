import { useEffect, useState } from "react";
import { getRecentEvents } from "../ops/eventsClient";

type BridgeEvent = {
  kind: string;
  node: string;
  payload?: any;
  ts?: string;
};

export default function EventStreamPanel() {
  const [events, setEvents] = useState<BridgeEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      const data = await getRecentEvents();
      setEvents(Array.isArray(data) ? data.slice().reverse() : []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.8 }}>Event Stream</div>
        <button onClick={refresh}>Refresh</button>
      </div>

      {error && (
        <div style={{ color: "#f88", marginTop: 8 }}>
          Error: {error}
        </div>
      )}

      <pre
        style={{
          marginTop: 10,
          fontSize: 12,
          whiteSpace: "pre-wrap",
          opacity: 0.9,
        }}
      >
        {JSON.stringify(events, null, 2)}
      </pre>
    </section>
  );
}

