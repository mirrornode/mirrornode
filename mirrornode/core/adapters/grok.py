import asyncio
import logging
from mirrornode.core.events.schema import MirrorNodeEvent
from . import BaseAdapter

logger = logging.getLogger(__name__)


class GrokAdapter(BaseAdapter):
    name = "grok"

    async def handle(self, event: MirrorNodeEvent) -> None:
        logger.info("[GROK] handling event %s payload=%r", event.trace_id, 
event.payload)
        await asyncio.sleep(0)

