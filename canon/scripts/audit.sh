#!/usr/bin/env bash
set -euo pipefail

REPO_URL="$1"
STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
OUT="canon/dossiers/audit-$(basename "$REPO_URL")-$STAMP.md"

if [[ -z "${REPO_URL:-}" ]]; then
  echo "Usage: ./audit.sh <git_repo_url>"
  exit 1
fi

echo "🔍 AUDIT START: $REPO_URL"

TMP="$(mktemp -d)"
git clone --depth=1 "$REPO_URL" "$TMP" >/dev/null 2>&1

cat > "$OUT" <<EODOSSIER
# DECLARED-STATE EXECUTION AUDIT

Repo: $REPO_URL  
Timestamp: $STAMP

## 1. Observable Facts
$(cd "$TMP" && git log -1 --oneline)

## 2. Structural Signals
$(cd "$TMP" && ls -1)

## 3. Governance Indicators
- LICENSE: $(cd "$TMP" && ls LICENSE* 2>/dev/null || echo "None")
- CI: $(cd "$TMP" && ls .github/workflows 2>/dev/null || echo "None")

## 4. Claims vs Evidence
Only what is visible is asserted.

## 5. Verdict
Audit completed under declared-state constraints.
EODOSSIER

rm -rf "$TMP"
echo "✓ Audit written to $OUT"
