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
    const data = JSON.parse(reader.result);
    renderAudit(data);
  };
  reader.readAsText(file);
};

function renderAudit(data) {
  resultsEl.innerHTML = "";
  targetEl.textContent = data.audit.target.path;
  timeEl.textContent = data.audit.timestamp;

  data.findings.forEach(f => {
    const div = document.createElement("div");
    div.className = \`result \${f.severity}\`;
    div.innerHTML = \`
      <strong>[\${f.severity.toUpperCase()}]</strong> \${f.title}<br/>
      \${f.description}
    \`;
    resultsEl.appendChild(div);
  });
}
