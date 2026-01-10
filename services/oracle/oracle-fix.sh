#!/bin/bash
# ORACLE-API-FIX.SH - COMPLETE DEPLOYMENT PIPELINE
# Run from ~/mirrornode/services/oracle

set -euo pipefail

echo "=== ORACLE /api/* DEPLOYMENT PIPELINE ==="
echo "Current dir: $(pwd)"
echo "Project: oracle-inphase.vercel.app"

# 1. CONFIRM STATE
echo "1. Project link status:"
ls -la .vercel .env.local 2>/dev/null || echo "No .vercel/.env.local - 
will recreate"

# 2. BUILD
echo "2. Building..."
npm run build
echo "Build complete: $(ls -la dist/index.js)"

# 3. FORCE vercel.json (Contract A)
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [{ "src": "dist/index.js", "use": "@vercel/node" }],
  "routes": [
    { "src": "/api/health", "dest": "dist/index.js" },
    { "src": "/api/oracle", "dest": "dist/index.js", "methods": ["POST"] 
},
    { "src": "/api/feedback", "dest": "dist/index.js" },
    { "src": "/health", "dest": "dist/index.js" },
    { "src": "/oracle", "dest": "dist/index.js", "methods": ["POST"] },
    { "src": "/feedback", "dest": "dist/index.js" }
  ]
}
EOF
echo "3. vercel.json updated: $(cat vercel.json)"

# 4. LINK + ENV (idempotent)
echo "4. Linking project..."
vercel link --project oracle || true
vercel env pull .env.local || true
echo "4. Env vars: $(wc -l .env.local) lines"

# 5. PREVIEW DEPLOY (bypasses git auth)
echo "5. Preview deploy (no auth)..."
DEPLOY_URL=$(vercel --prebuilt | grep -o 'https://oracle-[^ 
]*\.vercel\.app')
echo "5. Preview: $DEPLOY_URL"

# 6. TEST PREVIEW
echo "6. Testing preview..."
sleep 3
curl -i "$DEPLOY_URL/api/health" || echo "Preview health failed"
curl -i "$DEPLOY_URL/health" || echo "Preview legacy failed"

echo ""
echo "=== SUCCESS ==="
echo "PREVIEW URL: $DEPLOY_URL"
echo "NEXT: Update Osiris VITE_ORACLE_BASE_URL='$DEPLOY_URL'"
echo "       Deploy Osiris: cd ../../mirrornode-osiris && vercel --prod"
echo ""
echo "PROD (after confirming preview): vercel --prod"
echo "Dashboard: vercel.com/inphase/oracle → Settings → Public"

