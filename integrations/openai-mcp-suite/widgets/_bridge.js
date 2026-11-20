// Shared bridge, inlined into each template at load time. Renders with createElement and textContent only.
(function () {
  "use strict";
  var root = document.getElementById("root");
  function el(tag, text, cls) { var n = document.createElement(tag); if (text != null) n.textContent = String(text); if (cls) n.className = cls; return n; }
  function clear() { while (root.firstChild) root.removeChild(root.firstChild); }
  function show(envelope) {
    clear();
    if (!envelope || typeof envelope !== "object") { root.appendChild(el("p", "Waiting for data.", "muted")); return; }
    root.appendChild(el("p", "Synthetic data. Information only; nothing here approves or changes anything.", "banner"));
    if (envelope.outcome !== "success" || !envelope.result) { root.appendChild(el("p", "Not available for this sign-in.", "muted")); return; }
    window.__MN_RENDER(envelope.result, el, root);
  }
  window.__MN_SHOW = show;
  // Host bridge 1: window.openai alias (documented as compatibility alias).
  try { if (window.openai && window.openai.toolOutput) show(window.openai.toolOutput); } catch (e) { /* ignore */ }
  window.addEventListener("openai:set_globals", function () { try { show(window.openai && window.openai.toolOutput); } catch (e) { /* ignore */ } });
  // Host bridge 2: MCP Apps JSON-RPC over postMessage. Only the parent window is trusted as a sender.
  window.addEventListener("message", function (ev) {
    if (ev.source !== window.parent) return;
    var m = ev.data;
    if (!m || m.jsonrpc !== "2.0" || m.method !== "ui/notifications/tool-result") return;
    var p = m.params || {};
    show(p.structuredContent || null);
  });
  if (!(window.openai && window.openai.toolOutput)) show(null);
})();
