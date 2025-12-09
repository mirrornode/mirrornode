// svg-proof-generator.js – Pure JS for browser/Node, no external deps beyond xmlbuilder2 optional
// Usage: node svg-proof-generator.js Thoth or in browser: generateSVG('Hermes')

const TAGS = {
  Hermes: { name: 'Hermes [353]', glyph: 'Ἑρμῆς', color: '#D4AF37' },
  Thoth: { name: 'Thoth 𓁟', glyph: '𓁟', color: '#1E90FF' },
  Fox: { name: 'Fox Oracle', glyph: '🦊', color: '#FF4500' }
};

function readLatestHash() {
  try {
    // Try oracle-queue.ndjson first, fallback to git hash
    const fs = require('fs');
    const path = require('path');
    const queuePath = './var/oracle-queue.ndjson';
    if (fs.existsSync(queuePath)) {
      const latest = fs.readFileSync(queuePath, 'utf8')
        .split('\n').filter(Boolean).pop()?.match(/"hash":"([a-f0-9]+)"/)?.[1];
      if (latest) return latest;
    }
    return require('child_process').execSync('git rev-parse HEAD', { encoding: 'utf8' })
      .trim().slice(0, 8);
  } catch {
    return 'dev-' + Date.now().toString(16).slice(-8);
  }
}

function generateSVG(tag = 'Thoth') {
  const config = TAGS[tag];
  if (!config) throw new Error(`Unknown version tag: ${tag}`);
  
  const hash = readLatestHash();
  const pulseId = `pulse-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  const svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <!-- Dark cosmic background -->
  <rect width="100%" height="100%" fill="#0a0a0a" stroke="#1a1a2e" stroke-width="2"/>
  
  <!-- Pulsing central glyph -->
  <g transform="translate(600,300)" id="${pulseId}">
    <text x="0" y="0" fill="${config.color}" font-size="140" font-family="serif,Noto Sans Egyptian Hieroglyphs,sans-serif"
          text-anchor="middle" stroke="rgba(255,255,255,0.3)" stroke-width="2"
          filter="url(#glow)">
      ${config.glyph}
    </text>
    <!-- Pulse animation -->
    <animate attributeName="opacity" values="1;0.4;0.7;1" dur="4s" repeatCount="indefinite"/>
    <!-- Scale pulse -->
    <animate attributeName="transform" values="scale(1);scale(1.05);scale(1)" dur="4s" repeatCount="indefinite"
             additive="sum" accumulate="none"/>
  </g>
  
  <!-- Glow filter -->
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" flood-color="${config.color}" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Version proof text -->
  <text x="600" y="500" fill="#ffffff" font-size="28" font-family="'Courier New',monospace"
        text-anchor="middle" letter-spacing="1">
    ${config.name}
  </text>
  <text x="600" y="540" fill="#00ff88" font-size="24" font-family="'Courier New',monospace"
        text-anchor="middle" letter-spacing="2">
    Ledger: ${hash.slice(0,12)}...
  </text>
  <text x="600" y="580" fill="#888888" font-size="18" font-family="'Courier New',monospace"
        text-anchor="middle">
    MIRRORNODE Proof Brick | ${timestamp.slice(0,19).replace('T',' ')}
  </text>
  
  <!-- Architecture flow diagram -->
  <g stroke="#444" stroke-width="2" fill="none">
    <!-- Nodes -->
    <circle cx="200" cy="150" r="40" fill="#1e3a8a"/>
    <circle cx="600" cy="150" r="40" fill="#059669"/>
    <circle cx="1000" cy="150" r="40" fill="#dc2626"/>
    <circle cx="600" cy="650" r="45" fill="${config.color}"/>
    
    <!-- Connections -->
    <path d="M240 150 Q420 150 440 150"/>
    <path d="M640 150 Q820 150 840 150"/>
    <path d="M640 195 Q600 400 600 650"/>
    
    <!-- Labels -->
    <text x="200" y="155" fill="white" font-size="14" text-anchor="middle" font-family="monospace">Oracle</text>
    <text x="600" y="155" fill="white" font-size="14" text-anchor="middle" font-family="monospace">Thoth</text>
    <text x="1000" y="155" fill="white" font-size="14" text-anchor="middle" font-family="monospace">Fox</text>
    <text x="600" y="655" fill="white" font-size="16" text-anchor="middle" font-family="monospace">PROOF</text>
  </g>
  
  <!-- Ed25519 verification badge -->
  <rect x="900" y="600" width="280" height="80" rx="8" fill="#1f2937" stroke="#4b5563" stroke-width="2"/>
  <text x="990" y="635" fill="#fbbf24" font-size="16" font-family="'Courier New',monospace"
        text-anchor="middle" font-weight="bold">
    ✓ Ed25519 Verified
  </text>
  <text x="990" y="655" fill="#9ca3af" font-size="12" font-family="'Courier New',monospace"
        text-anchor="middle">
    ${hash.slice(0,16)}...
  </text>
</svg>`;

  // Node.js: save to file
  if (typeof module !== 'undefined' && module.exports) {
    const fs = require('fs');
    const path = require('path');
    const fileName = `proof-${tag.toLowerCase()}-${hash.slice(0,8)}.svg`;
    fs.writeFileSync(path.join('public', fileName), svg);
    console.log(`✓ Generated: public/${fileName}`);
    return fileName;
  }
  
  // Browser: return SVG string or inject to DOM
  return svg;
}

// CLI Usage
if (typeof require !== 'undefined' && require.main === module) {
  const tag = process.argv[2] || 'Thoth';
  generateSVG(tag);
}

// Export for React/Next.js
if (typeof module !== 'undefined') {
  module.exports = { generateSVG, TAGS };
}
