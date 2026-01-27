#!/usr/bin/env bash
set -euo pipefail

echo "🔱 MIRRORNODE CANON BOOTSTRAP"

ROOT="$HOME/mirrornode"
mkdir -p "$ROOT"
cd "$ROOT"

echo "✓ Root set: $ROOT"

mkdir -p canon/{charters,contracts,dossiers,scripts,index} logs

cat > canon/README.md <<'EOREADME'
# MIRRORNODE — Canon Root
Declared-state authority for charters, contracts, dossiers, scripts, index.
EOREADME

echo "✓ Canon README written"
echo "BOOTSTRAP COMPLETE"
