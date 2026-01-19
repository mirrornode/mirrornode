export default function SuccessPage() {
  return (
    <main style={{maxWidth: 880, margin: "0 auto", padding: 24}}>
      <h1>Access granted</h1>
      <p>Your purchase is confirmed.</p>

      <div style={{display:"flex", gap: 12, marginTop: 16}}>
        <a href="/osiris-audit/app" style={{padding:"12px 16px", border:"1px solid #333", borderRadius: 8}}>
          Open Osiris Audit Tool
        </a>
        <a href="/osiris-audit/resources" style={{padding:"12px 16px", border:"1px solid #333", borderRadius: 8}}>
          View Quickstart & Resources
        </a>
      </div>

      <p style={{marginTop: 16, fontSize: 14}}>
        Support: <strong>support@yourdomain</strong>
      </p>
    </main>
  );
}
