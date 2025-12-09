import asyncio
import logging
from mirrornode.core.events.schema import MirrorNodeEvent
from . import BaseAdapter

logger = logging.getLogger(__name__)


class ClaudeAdapter(BaseAdapter):
    name = "claude"

    async def handle(self, event: MirrorNodeEvent) -> None:
        logger.info("[CLAUDE] handling event %s payload=%r", event.trace_id, 
event.payload)
        await asyncio.sleep(0)

