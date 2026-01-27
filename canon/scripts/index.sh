#!/usr/bin/env bash
set -euo pipefail

ORG="$1"
OUT="canon/index/github-$ORG.json"

if [[ -z "${ORG:-}" ]]; then
  echo "Usage: ./index.sh <github_org_or_user>"
  exit 1
fi

echo "📚 INDEXING GITHUB: $ORG"

gh repo list "$ORG" --limit 200 --json name,description,url,updatedAt > "$OUT"

echo "✓ Index written to $OUT"
