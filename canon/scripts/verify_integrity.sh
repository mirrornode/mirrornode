#!/usr/bin/env bash
set -euo pipefail

echo "🔐 CANON INTEGRITY VERIFICATION"
echo ""

CANON_ROOT="${CANON_ROOT:-$HOME/mirrornode/canon}"

echo "Checking charters..."
CHARTERS=$(find "$CANON_ROOT/charters" -name "*.md" -not -name "*.sig" | wc -l | tr -d ' ')
echo "  Found $CHARTERS charter files"

echo ""
echo "Charter Hashes:"
find "$CANON_ROOT/charters" -name "*.md" -not -name "*.sig" | while read charter; do
  NAME=$(basename "$charter" .md)
  HASH=$(shasum -a 256 "$charter" | cut -d' ' -f1)
  echo "  $NAME: $HASH"
done

echo ""
echo "Checking SDK files..."
if [[ -f "$CANON_ROOT/contracts/sdk/audit.py" ]]; then
  echo "  ✓ Python SDK present"
else
  echo "  ✗ Python SDK missing"
fi

if [[ -f "$CANON_ROOT/contracts/sdk/audit.ts" ]]; then
  echo "  ✓ TypeScript SDK present"
else
  echo "  ✗ TypeScript SDK missing"
fi

echo ""
echo "Audit Statistics:"
TOTAL_AUDITS=$(find "$CANON_ROOT/dossiers" -name "audit-*.json" 2>/dev/null | wc -l | tr -d ' ')
echo "  Total audits: $TOTAL_AUDITS"

echo ""
echo "✓ Integrity check complete"
