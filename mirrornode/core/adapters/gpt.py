import asyncio
import logging
from mirrornode.core.events.schema import MirrorNodeEvent
from . import BaseAdapter

logger = logging.getLogger(__name__)


class GptAdapter(BaseAdapter):
    name = "gpt"

    async def handle(self, event: MirrorNodeEvent) -> None:
        logger.info("[GPT] handling event %s payload=%r", event.trace_id, 
event.payload)
        await asyncio.sleep(0)

