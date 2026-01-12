import asyncio
import logging
import os
from mirrornode.core.events.schema import MirrorNodeEvent
from . import BaseAdapter

logger = logging.getLogger(__name__)


class ClaudeAdapter(BaseAdapter):
    name = "claude"

    def __init__(self):
        self.client = None
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            import anthropic
            self.client = anthropic.Anthropic(api_key=api_key)

    async def handle(self, event: MirrorNodeEvent) -> dict:
        logger.info("[CLAUDE] handling event %s payload=%r", event.trace_id, event.payload)
        
        if not self.client:
            logger.warning("[CLAUDE] No API key, returning stub response")
            return {
                "node": self.name,
                "response": "STUB: No API key configured",
                "vote": None
            }
        
        prompt = event.payload.get("prompt") or event.payload.get("message", "")
        
        try:
            response = await asyncio.to_thread(
                self.client.messages.create,
                model="claude-3-5-sonnet-20241022",
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )
            
            result = response.content[0].text
            logger.info("[CLAUDE] response: %s", result[:100])
            
            return {
                "node": self.name,
                "response": result,
                "vote": result if event.request_consensus else None
            }
            
        except Exception as e:
            logger.error("[CLAUDE] API error: %s", e)
            return {
                "node": self.name,
                "response": f"ERROR: {str(e)}",
                "vote": None
            }
