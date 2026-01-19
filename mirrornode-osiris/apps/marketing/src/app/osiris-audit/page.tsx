export default function OsirisAuditPage() {
  return (
    <main style={{maxWidth: 880, margin: "0 auto", padding: 24}}>
      <h1>Osiris Audit</h1>
      <p>
        Fixed-price security and logic audit for codebases.
        One purchase. Clear results. No setup.
      </p>

      <ul>
        <li>Upload a repo ZIP or provide a repository URL</li>
        <li>Receive a risk score, severity breakdown, and fix list</li>
        <li>Rerun after changes to confirm improvement</li>
      </ul>

      <a
        href={process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "#"}
        style={{display:"inline-block", padding:"12px 16px", border:"1px solid #333", borderRadius: 8}}
      >
        Purchase Access ($149)
      </a>

      <p style={{marginTop: 16, fontSize: 14}}>
        AI-assisted analysis. See <a href="/legal/ai-disclosure">AI Disclosure</a>.
      </p>
    </main>
  );
}
