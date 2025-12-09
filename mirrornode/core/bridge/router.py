# mirrornode/core/bridge/router.py

from __future__ import annotations
from typing import Dict, List, Callable, Coroutine, Any
import asyncio
import logging

from mirrornode.core.events.schema import MirrorNodeEvent

logger = logging.getLogger(__name__)


class EventRouter:
    """
    Central in-memory router for MirrorNodeEvent objects.

    - keeps a bounded list of recent events
    - fans out events to registered subscribers via queues
    - can be extended to route by node, event_type, etc.
    """

    def __init__(self, history_size: int = 1000):
        self.history: List[MirrorNodeEvent] = []
        self.history_size = history_size

        # subscribers: name -> coroutine(event)
        self.subscribers: Dict[str, Callable[[MirrorNodeEvent], 
Coroutine[Any, Any, None]]] = {}

        # adapters: name -> callable(event)
        self.adapters: Dict[str, Callable[[MirrorNodeEvent], Any]] = {}

    # --------------------------------------------------------
    # SUBSCRIBE & ADAPTER REGISTRATION
    # --------------------------------------------------------

    def register_subscriber(
        self,
        name: str,
        handler: Callable[[MirrorNodeEvent], Coroutine[Any, Any, None]]
    ) -> None:
        logger.info(f"[router] Registered subscriber: {name}")
        self.subscribers[name] = handler

    def register_adapter(
        self,
        name: str,
        adapter: Callable[[MirrorNodeEvent], Any]
    ) -> None:
        """
        Adapters receive events but do NOT need to be async.
        They return transformed output or None.
        """
        logger.info(f"[router] Registered adapter: {name}")
        self.adapters[name] = adapter

    # --------------------------------------------------------
    # EVENT DISPATCH
    # --------------------------------------------------------

    async def dispatch(self, event: MirrorNodeEvent) -> Dict[str, Any]:
        """
        Dispatch an event to:
        - all async subscribers
        - all sync adapters

        Returns a dict containing adapter results.
        """
        logger.debug(f"[router] Dispatching event: {event.event_type}")

        # save to history
        self.history.append(event)
        if len(self.history) > self.history_size:
            self.history.pop(0)

        responses: Dict[str, Any] = {}

        # fire async subscribers
        await asyncio.gather(
            *(handler(event) for handler in self.subscribers.values()),
            return_exceptions=False
        )

        # run sync adapters
        for name, adapter in self.adapters.items():
            try:
                responses[name] = adapter(event)
            except Exception as ex:
                logger.error(f"[router] Adapter '{name}' error: {ex}")
                responses[name] = None

        return responses

    # --------------------------------------------------------
    # UTILITIES
    # --------------------------------------------------------

    def get_recent(self, limit: int = 50) -> List[MirrorNodeEvent]:
        """Return last N events from history."""
        return self.history[-limit:]

