import ray
import logging
import os
from typing import Dict, Optional, List

from mirrornode.core.events.schema import (
    MirrorNodeEvent,
    ConsensusResult,
    EventType,
)
from mirrornode.core.adapters import (
    GptAdapter,
    ClaudeAdapter,
    GrokAdapter,
    TheiaAdapter,
)
from mirrornode.core.contracts.adapter_response import AdapterResponse
from mirrornode.core.aggregation.aggregate import aggregate_responses

logger = logging.getLogger(__name__)


@ray.remote
class DistributedAdapter:
    def __init__(self, adapter_class, api_keys: Dict[str, str]):
        for key, value in api_keys.items():
            if value:
                os.environ[key] = value

        self.adapter = adapter_class()
        self.name = self.adapter.node_id

    async def handle(self, event: MirrorNodeEvent) -> AdapterResponse:
        return await self.adapter.handle(event)


class MirrorNodeOrchestrator:
    def __init__(self):
        self.adapters: Dict[str, ray.ObjectRef] = {}
        self.initialized = False

    def initialize(self):
        if not ray.is_initialized():
            ray.init(ignore_reinit_error=True)

        logger.info("Deploying MirrorNode lattice")

        api_keys = {
            "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY", ""),
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
        }

        self.adapters = {
            "gpt": DistributedAdapter.remote(GptAdapter, api_keys),
            "claude": DistributedAdapter.remote(ClaudeAdapter, api_keys),
            "grok": DistributedAdapter.remote(GrokAdapter, api_keys),
            "theia": DistributedAdapter.remote(TheiaAdapter, api_keys),
        }

        self.initialized = True
        logger.info(
            "Deployed %d distributed adapters",
            len(self.adapters),
        )
        return self

    async def route_event(
        self,
        event: MirrorNodeEvent,
        target: Optional[str] = None,
    ):
        if not self.initialized:
            raise RuntimeError(
                "Orchestrator not initialized"
            )

        event.ensure_metadata()

        if target:
            adapter = self.adapters.get(target)
            if not adapter:
                raise ValueError("Unknown adapter")

            return await adapter.handle.remote(event)

        futures = [
            adapter.handle.remote(event)
            for adapter in self.adapters.values()
        ]

        responses: List[AdapterResponse] = ray.get(futures)
        return aggregate_responses(responses)

    async def request_consensus(
        self,
        event: MirrorNodeEvent,
    ) -> ConsensusResult:
        if not self.initialized:
            raise RuntimeError(
                "Orchestrator not initialized"
            )

        event.ensure_metadata()
        event.request_consensus = True

        futures = [
            adapter.handle.remote(event)
            for adapter in self.adapters.values()
        ]

        responses: List[AdapterResponse] = ray.get(futures)
        aggregate = aggregate_responses(responses)

        return ConsensusResult(
            consensus_reached=aggregate["success"],
            votes={
                r.node_id: r.to_dict()
                for r in responses
            },
            trace_id=event.trace_id,
        )

    def shutdown(self):
        logger.info("Shutting down MirrorNode lattice")
        ray.shutdown()


def create_orchestrator() -> MirrorNodeOrchestrator:
    return MirrorNodeOrchestrator().initialize()

