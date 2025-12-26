const loadBtn = document.getElementById("load-json");
const fileInput = document.getElementById("file-input");
const resultsEl = document.getElementById("results");
const targetEl = document.getElementById("target");
const timeEl = document.getElementById("timestamp");

loadBtn.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      renderAudit(data);
    } catch (err) {
      showError("Invalid JSON: " + err.message);
    }
  };
  reader.onerror = () => {
    showError("Failed to read file.");
  };
  reader.readAsText(file);
};

function showError(msg) {
  resultsEl.innerHTML = "";
  const div = document.createElement("div");
  div.className = "result fail";
  div.textContent = msg;
  resultsEl.appendChild(div);
}

function renderAudit(data) {
  // Validate minimum schema
  if (!data.audit || !data.findings) {
    showError("JSON does not match OSIRIS audit schema.");
    return;
  }

  resultsEl.innerHTML = "";
  targetEl.textContent = data.audit.target?.path || "Unknown target";
  timeEl.textContent = data.audit.timestamp || "—";

  if (data.findings.length === 0) {
    const div = document.createElement("div");
    div.className = "result info";
    div.textContent = "No findings.";
    resultsEl.appendChild(div);
    return;
  }

  data.findings.forEach(f => {
    const div = document.createElement("div");
    div.className = `result ${f.severity || "info"}`;
    div.innerHTML = `
      <strong>[${(f.severity || "info").toUpperCase()}]</strong>
      ${f.title || "Untitled finding"}<br/>
      ${f.description || ""}
    `;
    resultsEl.appendChild(div);
  });
}
