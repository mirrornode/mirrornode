import asyncio
import logging
import os
from typing import Dict, Any

from mirrornode.core.events.schema import MirrorNodeEvent
from . import BaseAdapter

logger = logging.getLogger(__name__)


class ClaudeAdapter(BaseAdapter):
    name = "claude"

    def __init__(self):
        self.client = None
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            try:
                import anthropic  # local import to avoid hard dependency when not configured
                self.client = anthropic.Anthropic(api_key=api_key)
            except Exception:
                logger.exception("Failed to initialize Anthropic client")
                self.client = None

    async def handle(self, event: MirrorNodeEvent) -> Dict[str, Any]:
        logger.info("[CLAUDE] handling event %s payload=%r", event.trace_id, event.payload)

        if not self.client:
            logger.warning("[CLAUDE] No API key, returning stub response")
            return {
                "node": self.name,
                "response": "STUB: No API key configured",
                "vote": None,
            }

        prompt = event.payload.get("prompt") or event.payload.get("message") or ""

        try:
            response = await asyncio.to_thread(
                self.client.messages.create,
                model="claude-3-5-sonnet-20241022",
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}],
            )

            result = None
            if hasattr(response, "content"):
                content = response.content
                if isinstance(content, (list, tuple)) and len(content) > 0:
                    first = content[0]
                    if isinstance(first, dict) and "text" in first:
                        result = first["text"]
                    elif hasattr(first, "text"):
                        result = getattr(first, "text")
                elif isinstance(content, str):
                    result = content

            if result is None:
                result = str(response)

            logger.info("[CLAUDE] response: %s", (result[:100] if result else ""))

            return {
                "node": self.name,
                "response": result,
                "vote": result if getattr(event, "request_consensus", False) else None,
            }

        except Exception as e:
            logger.exception("[CLAUDE] API error")
            return {
                "node": self.name,
                "response": f"ERROR: {str(e)}",
                "vote": None,
            }