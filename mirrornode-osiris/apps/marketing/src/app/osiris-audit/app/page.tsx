export default function ToolPage() {
  return (
    <main style={{maxWidth: 1100, margin: "0 auto", padding: 24}}>
      <h1>Osiris Audit Tool</h1>
      <p style={{fontSize: 14}}>
        Upload a codebase (ZIP) or provide a repository URL.
      </p>

      <div style={{marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 10}}>
        <strong>TODO:</strong> Mount the real Osiris Audit UI here.
      </div>

      <footer style={{marginTop: 28, fontSize: 14}}>
        <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/ai-disclosure">AI Disclosure</a>
      </footer>
    </main>
  );
}
