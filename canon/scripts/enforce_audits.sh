#!/usr/bin/env bash
set -euo pipefail

STRICT_MODE="${1:-}"

echo "🔍 OSIRIS AUDIT ENFORCEMENT CHECK"

CANON_ROOT="${CANON_ROOT:-$HOME/mirrornode/canon}"
DOSSIERS="$CANON_ROOT/dossiers"

CURRENT_MONTH="$(date +%Y-%m)"
AUDIT_DIR="$DOSSIERS/$CURRENT_MONTH"

if [[ ! -d "$AUDIT_DIR" ]]; then
  echo "⚠️  No audits found for $CURRENT_MONTH"
  exit 0
fi

TOTAL_AUDITS=$(find "$AUDIT_DIR" -name "audit-*.json" -type f | wc -l | tr -d ' ')
echo "📊 Audits this month: $TOTAL_AUDITS"

EXIT_CODE=0

# Check for unchartered repos
UNCHARTERED=$(grep -r '"charter_hash": "UNCHARTERED"' "$AUDIT_DIR" 2>/dev/null | wc -l | tr -d ' ')

if [[ "$UNCHARTERED" -gt 0 ]]; then
  echo "⚠️  Found $UNCHARTERED executions from UNCHARTERED repos"
  echo ""
  echo "Unchartered repos:"
  grep -h '"repo":' "$AUDIT_DIR"/*.json | grep -B1 '"charter_hash": "UNCHARTERED"' | grep '"repo"' | sed 's/.*"repo": "\([^"]*\)".*/  - \1/' | sort | uniq
  echo ""
  
  # Only fail in strict mode for unchartered repos
  if [[ "$STRICT_MODE" == "--strict" ]]; then
    EXIT_CODE=1
  fi
fi

# Check for failures (ALWAYS fail on these)
FAILURES=$(grep -r '"verdict": "FAILURE"' "$AUDIT_DIR" 2>/dev/null | wc -l | tr -d ' ')

if [[ "$FAILURES" -gt 0 ]]; then
  echo "❌ Found $FAILURES failed executions"
  echo ""
  echo "Failed repos:"
  grep -h '"repo":' "$AUDIT_DIR"/*.json | grep -B1 '"verdict": "FAILURE"' | grep '"repo"' | sed 's/.*"repo": "\([^"]*\)".*/  - \1/' | sort | uniq
  echo ""
  
  EXIT_CODE=1  # Always fail
fi

# Check for blocked executions (ALWAYS fail on these)
BLOCKED=$(grep -r '"verdict": "BLOCKED"' "$AUDIT_DIR" 2>/dev/null | wc -l | tr -d ' ')

if [[ "$BLOCKED" -gt 0 ]]; then
  echo "🚫 Found $BLOCKED blocked executions"
  EXIT_CODE=1  # Always fail
fi

# Final status
if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo "✅ No violations detected"
elif [[ "$STRICT_MODE" != "--strict" && "$FAILURES" -eq 0 && "$BLOCKED" -eq 0 ]]; then
  echo "⚠️  Warnings present (unchartered repos)"
  echo "💡 Run with --strict to fail CI/CD on unchartered repos"
  EXIT_CODE=0  # Don't fail in non-strict mode if only unchartered
else
  echo "⚠️  Violations detected"
  if [[ "$STRICT_MODE" != "--strict" ]]; then
    echo "💡 Run with --strict to enforce charter compliance"
  fi
fi

exit $EXIT_CODE
