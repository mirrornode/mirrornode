from abc import ABC, abstractmethod
from typing import Any
from mirrornode.core.events.schema import MirrorNodeEvent


class BaseAdapter(ABC):
    name: str = "base"

    @abstractmethod
    async def handle(self, event: MirrorNodeEvent) -> None:
        """
        Handle an incoming MirrorNodeEvent.
        Implementations should be non-blocking and return quickly.
        """
        raise NotImplementedError()

