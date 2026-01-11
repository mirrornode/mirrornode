from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional

from mirrornode.core.contracts.adapter_response import (
    AdapterResponse,
    AdapterStatus,
)


class BaseAdapter(ABC):
    """
    Canonical base adapter.
    Enforces AdapterResponse contract.
    """

    def __init__(self, node_id: str):
        self.node_id = node_id

    @abstractmethod
    def _invoke(self, prompt: str) -> Dict[str, Any]:
        """
        Provider-specific implementation.
        May raise exceptions.
        """
        raise NotImplementedError

    def invoke(self, prompt: str) -> AdapterResponse:
        """
        Public entrypoint.
        Never returns None.
        Never throws uncaught exceptions.
        """
        start = datetime.now(timezone.utc)

        try:
            result = self._invoke(prompt)
            latency_ms = (
                datetime.now(timezone.utc) - start
            ).total_seconds() * 1000

            return AdapterResponse(
                status=AdapterStatus.OK,
                node_id=self.node_id,
                payload=result,
                error=None,
                latency_ms=latency_ms,
            )

        except Exception as e:
            latency_ms = (
                datetime.now(timezone.utc) - start
            ).total_seconds() * 1000

            code, retry_after = self._classify_error(e)

            return AdapterResponse(
                status=(
                    AdapterStatus.ERROR
                    if retry_after is not None
                    else AdapterStatus.UNAVAILABLE
                ),
                node_id=self.node_id,
                payload={
                    "content": None,
                    "model": None,
                    "tokens_used": None,
                },
                error={
                    "code": code,
                    "message": str(e),
                    "retry_after": retry_after,
                },
                latency_ms=latency_ms,
            )

    def _classify_error(self, e: Exception) -> Tuple[str, Optional[int]]:
        """
        Map exceptions to canonical error codes.
        """
        msg = str(e).lower()

        if "quota" in msg or "429" in msg:
            return "quota_exceeded", 3600
        if "auth" in msg or "api key" in msg:
            return "auth_not_configured", None
        if "timeout" in msg or "unavailable" in msg:
            return "model_unavailable", 300

        return "unknown_error", None

