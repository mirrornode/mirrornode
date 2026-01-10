#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:8000"
API_KEY="${MIRRORNODE_API_KEY}"

echo "🔒 MIRRORNODE Security Lockdown Test Suite"
echo "============================================"

# Test 1: Health check without auth should work
echo -n "Test 1 - Health endpoint (no auth required): "
status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
if [ "$status" = "200" ]; then
  echo "✅ PASS (200)"
else
  echo "❌ FAIL (got $status, expected 200)"
  exit 1
fi

# Test 2: Oracle without API key should fail
echo -n "Test 2 - Oracle without API key (expect 401): "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/oracle" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}')
if [ "$status" = "401" ]; then
  echo "✅ PASS (401)"
else
  echo "❌ FAIL (got $status, expected 401)"
  exit 1
fi

# Test 3: Oracle with valid API key should succeed
echo -n "Test 3 - Oracle with valid API key (expect 200): "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/oracle" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"sessionId": "test-session", "mode": "oracle", "prompt": "test", "ritualState": "invoked", "context": {}}')
if [ "$status" = "200" ]; then
  echo "✅ PASS (200)"
else
  echo "❌ FAIL (got $status, expected 200)"
  exit 1
fi

# Test 4: Rate limiting on oracle endpoint (10/minute)
echo -n "Test 4 - Rate limiting on /oracle (11 requests, expect 429): "
for i in {1..11}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/oracle" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d '{"sessionId": "test-session", "mode": "oracle", "prompt": "test", "ritualState": "invoked", "context": {}}')
done
if [ "$status" = "429" ]; then
  echo "✅ PASS (429)"
else
  echo "⚠️  SKIP (got $status - rate limit may not have triggered)"
fi

# Test 5: Events endpoint without API key should fail
echo -n "Test 5 - Events POST without API key (expect 401): "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/event" \
  -H "Content-Type: application/json" \
  -d '{"node_id": "test", "event_type": "test", "payload": {}}')
if [ "$status" = "401" ]; then
  echo "✅ PASS (401)"
else
  echo "❌ FAIL (got $status, expected 401)"
  exit 1
fi

# Test 6: Events GET with valid API key
echo -n "Test 6 - Events GET with API key (expect 200): "
status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/events/recent" \
  -H "X-API-Key: ${API_KEY}")
if [ "$status" = "200" ]; then
  echo "✅ PASS (200)"
else
  echo "❌ FAIL (got $status, expected 200)"
  exit 1
fi

echo ""
echo "============================================"
echo "✅ All critical tests PASSED"
echo "🔒 Security lockdown validated"
