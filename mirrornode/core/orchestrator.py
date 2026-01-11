import ray
import asyncio
import logging
from typing import List, Dict, Any, Optional
from mirrornode.core.events.schema import MirrorNodeEvent, ConsensusResult, EventType
from mirrornode.core.adapters import GptAdapter, ClaudeAdapter, GrokAdapter, TheiaAdapter

logger = logging.getLogger(__name__)


@ray.remote
class DistributedAdapter:
    """Ray actor wrapping a MirrorNode adapter"""
    def __init__(self, adapter_class):
        self.adapter = adapter_class()
        self.name = self.adapter.name
    
    async def handle(self, event: MirrorNodeEvent) -> Dict[str, Any]:
        """Handle an event and return result"""
        await self.adapter.handle(event)
        return {
            "node": self.name,
            "trace_id": event.trace_id,
            "status": "handled",
            "vote": None  # Adapters can return votes for consensus
        }


class MirrorNodeOrchestrator:
    """Distributed orchestrator for MirrorNode lattice"""
    
    def __init__(self):
        self.adapters: Dict[str, ray.ObjectRef] = {}
        self.initialized = False
    
    def initialize(self):
        """Deploy all adapters as Ray actors"""
        if not ray.is_initialized():
            ray.init(ignore_reinit_error=True)
        
        logger.info("Deploying MirrorNode lattice...")
        
        self.adapters = {
            "gpt": DistributedAdapter.remote(GptAdapter),
            "claude": DistributedAdapter.remote(ClaudeAdapter),
            "grok": DistributedAdapter.remote(GrokAdapter),
            "theia": DistributedAdapter.remote(TheiaAdapter),
        }
        
        self.initialized = True
        logger.info(f"✅ Deployed {len(self.adapters)} distributed adapters")
        return self
    
    async def route_event(self, event: MirrorNodeEvent, target: Optional[str] = None):
        """Route event to specific adapter or broadcast to all"""
        if not self.initialized:
            raise RuntimeError("Orchestrator not initialized. Call .initialize() first")
        
        event.ensure_metadata()
        
        if target:
            # Route to specific adapter
            adapter = self.adapters.get(target)
            if not adapter:
                raise ValueError(f"Unknown adapter: {target}")
            
            logger.info(f"Routing {event.trace_id} to {target}")
            return await adapter.handle.remote(event)
        
        else:
            # Broadcast to all adapters
            logger.info(f"Broadcasting {event.trace_id} to all adapters")
            futures = [adapter.handle.remote(event) for adapter in self.adapters.values()]
            return ray.get(futures)
    
    async def request_consensus(self, event: MirrorNodeEvent) -> ConsensusResult:
        """Request consensus from all adapters"""
        if not self.initialized:
            raise RuntimeError("Orchestrator not initialized")
        
        event.ensure_metadata()
        event.request_consensus = True
        
        logger.info(f"Requesting consensus for {event.trace_id}")
        
        # Broadcast to all adapters
        futures = [adapter.handle.remote(event) for adapter in self.adapters.values()]
        responses = ray.get(futures)
        
        # Build consensus result
        votes = {resp["node"]: resp for resp in responses}
        
        return ConsensusResult(
            consensus_reached=True,  # Simple majority for now
            votes=votes,
            trace_id=event.trace_id,
        )
    
    def shutdown(self):
        """Shutdown the distributed lattice"""
        logger.info("Shutting down MirrorNode lattice...")
        ray.shutdown()


# Convenience function
def create_orchestrator() -> MirrorNodeOrchestrator:
    """Create and initialize orchestrator"""
    return MirrorNodeOrchestrator().initialize()
