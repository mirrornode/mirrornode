#!/usr/bin/env bash
set -euo pipefail

CHARTER="$1"

if [[ -z "${CHARTER:-}" ]] || [[ ! -f "$CHARTER" ]]; then
  echo "Usage: ./sign_charter.sh <path_to_charter>"
  exit 1
fi

echo "🔏 SIGNING CHARTER: $CHARTER"

# Generate SHA256 hash
HASH=$(shasum -a 256 "$CHARTER" | awk '{print $1}')

# Create signature file
SIG_FILE="${CHARTER}.sig"
cat > "$SIG_FILE" <<EOSIG
Charter: $(basename "$CHARTER")
Hash: sha256:$HASH
Signed: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Authority: MIRRORNODE Canon v1.0.0
EOSIG

echo "✓ Signature written to $SIG_FILE"
echo "✓ Hash: sha256:$HASH"
