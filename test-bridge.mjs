#!/usr/bin/env node
/**
 * Integration test: TypeScript → Python Bridge
 */

import { BridgeClient } from "./cores/mirrornode-core/dist/bridge/BridgeClient.js";

async function testBridge() {
  console.log("🔗 Testing MIRRORNODE Bridge Integration...\n");

  const client = new BridgeClient("http://localhost:8420");

  // 1. Health check
  console.log("1️⃣  Health check...");
  const health = await client.health();
  console.log("   ✓ Bridge is online:", health);
  console.log("");

  // 2. Post an event
  console.log("2️⃣  Posting test event...");
  const event = {
    node: "typescript-client",
    kind: "INTEGRATION_TEST",
    payload: {
      message: "Hello from TypeScript monorepo!",
      timestamp: new Date().toISOString(),
      source: "test-bridge.mjs"
    }
  };
  const posted = await client.postEvent(event);
  console.log("   ✓ Event posted:", posted.stored?.id);
  console.log("");

  // 3. Retrieve recent events
  console.log("3️⃣  Fetching recent events...");
  const recent = await client.getRecent(5);
  console.log(`   ✓ Retrieved ${recent.count} events`);
  recent.events?.forEach((e, i) => {
    console.log(`      ${i + 1}. [${e.kind}] from ${e.node} at ${e.ts}`);
  });
  console.log("");

  console.log("✅ Bridge integration test PASSED!");
}

testBridge().catch((err) => {
  console.error("❌ Bridge test FAILED:", err.message);
  process.exit(1);
});
