#!/usr/bin/env bash
set -e

ORG_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$ORG_ROOT/canon/index"
OUT_FILE="$OUT_DIR/repos.json"

mkdir -p "$OUT_DIR"

echo "Indexing MIRRORNODE repositories..."

repos_json="$(printf '%s\n' "$repos" | jq -R . | jq -s .)"

jq -n \
  --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --argjson repos "$repos_json" \
  '{
    schema: "canon.index.v1",
    generated_at: $ts,
    repo_count: ($repos | length),
    repos: $repos
  }' > "$OUT_FILE"

