import { createTheiaGateway } from "../index";
import assert from "assert";

/**
 * Tiny smoke test to verify theia-core → mirrornode-core wiring.
 * Run this with ts-node or wire it into your test runner.
 */

const gateway = createTheiaGateway({ environment: "test" });

const fakeEvent = {
  version: "1.0.0",
  type: "INTEGRATION",
  meta: {
    id: "test-event-1",
    timestamp: new Date().toISOString(),
    source: "unit-test"
  },
  payload: {
    data: { hello: "world" },
    tags: ["smoke"]
  }
} as any;

async function runSmoke() {
  const res = await gateway.handleEvent(fakeEvent);
  assert.strictEqual(res.ok, true, "Expected response.ok === true");

  if ((res as any).result?.coreResult) {
    assert.strictEqual(
      (res as any).result.coreResult.handled,
      true,
      "Expected coreResult.handled === true"
    );
  }

  console.log("theia-core smoke test: PASS", {
    id: fakeEvent.meta.id,
    status: res.status
  });
}

if (require.main === module) {
  runSmoke().catch((err) => {
    console.error("theia-core smoke test: FAIL", err);
    process.exit(1);
  });
}