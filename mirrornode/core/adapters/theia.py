import asyncio
import logging
from mirrornode.core.events.schema import MirrorNodeEvent
from . import BaseAdapter

logger = logging.getLogger(__name__)


class TheiaAdapter(BaseAdapter):
    name = "theia"

    async def handle(self, event: MirrorNodeEvent) -> None:
        logger.info("[THEIA] handling event %s payload=%r", event.trace_id, 
event.payload)
        await asyncio.sleep(0)

