import asyncio
from mirrornode.core.orchestrator import create_orchestrator
from mirrornode.core.events.schema import create_event, EventType

orchestrator = create_orchestrator()

event = create_event(
    event_type=EventType.INTEGRATION,
    node="test-node",
    source={"node": "terminal", "surface": "cli", "origin": "morningstar"},
    payload={"message": "Ray-powered MirrorNode lattice test"}
)

print(f"\n🌐 Broadcasting event {event.trace_id} to lattice...")
results = asyncio.run(orchestrator.route_event(event))

print(f"\n✅ All {len(results)} adapters handled the event")
for result in results:
    print(f"  - {result['node']}: {result['status']}")

orchestrator.shutdown()
print("\n✨ Test complete")
