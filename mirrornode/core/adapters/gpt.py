import asyncio
import logging
import os

from mirrornode.core.events.schema import MirrorNodeEvent
from mirrornode.core.adapters.base import BaseAdapter
from mirrornode.core.contracts.adapter_response import AdapterResponse

logger = logging.getLogger(__name__)


class GptAdapter(BaseAdapter):
    """
    Canonical GPT adapter.
    Fully compliant with AdapterResponse contract.
    """

    name = "gpt"

    def __init__(self):
        super().__init__(node_id="gpt")
        self.client = None

        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            import openai
            self.client = openai.OpenAI(api_key=api_key)

    def _invoke(self, prompt: str) -> dict:
        """
        Provider-specific logic.
        May raise exceptions — BaseAdapter.invoke() handles them.
        """
        if not self.client:
            raise RuntimeError("API key not configured")

        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )

        return {
            "content": response.choices[0].message.content,
            "model": response.model,
            "tokens_used": response.usage.total_tokens if response.usage 
else None,
        }

    async def handle(self, event: MirrorNodeEvent) -> AdapterResponse:
        """
        Event entrypoint.
        Delegates to canonical invoke() safely.
        """
        logger.info(
            "[GPT] handling event %s payload=%r",
            event.trace_id,
            event.payload,
        )

        prompt = (
            event.payload.get("prompt")
            or event.payload.get("message")
            or ""
        )

        # Run synchronous invoke() in a worker thread
        return await asyncio.to_thread(self.invoke, prompt)

