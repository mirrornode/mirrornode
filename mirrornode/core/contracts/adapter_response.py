from enum import Enum
from datetime import datetime, timezone
from typing import Optional, Dict, Any


class AdapterStatus(Enum):
    OK = "ok"
    DEGRADED = "degraded"
    ERROR = "error"
    UNAVAILABLE = "unavailable"


class AdapterResponse:
    """
    Canonical Adapter Response Envelope — LOCKED
    """

    def __init__(
        self,
        status: AdapterStatus,
        node_id: str,
        payload: Dict[str, Any],
        error: Optional[Dict[str, Any]] = None,
        latency_ms: Optional[float] = None,
    ):
        if status == AdapterStatus.OK and error is not None:
            raise ValueError("error must be null when status is 'ok'")

        self.status = status
        self.node_id = node_id
        self.payload = payload
        self.error = error
        self.metadata = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latency_ms": latency_ms,
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "node_id": self.node_id,
            "payload": self.payload,
            "error": self.error,
            "metadata": self.metadata,
        }

