# mirrornode/core/events/schema.py
from __future__ import annotations
import enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class EventType(str, enum.Enum):
    INTEGRATION = "INTEGRATION"
    EXECUTION = "EXECUTION"
    ANALYSIS = "ANALYSIS"
    REFLECTION = "REFLECTION"
    MANIFESTATION = "MANIFESTATION"


class ConsensusResult(BaseModel):
    consensus_reached: bool = False
    votes: Dict[str, Any] = Field(default_factory=dict)
    agreed_payload: Optional[Dict[str, Any]] = None
    trace_id: Optional[str] = None
    timestamp: Optional[datetime] = None


class MirrorNodeEvent(BaseModel):
    version: str = Field(default="mirrornode.event.v1")
    event_type: EventType
    node: str
    source: Dict[str, Any] = Field(
        ...,
        description="Source information. Must include keys: node, surface, origin",
        example={"node": "bridge", "surface": "http", "origin": "user-api"},
    )
    payload: Dict[str, Any] = Field(default_factory=dict)
    request_consensus: bool = False
    trace_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    priority: Optional[int] = None

    def ensure_metadata(self) -> None:
        if not self.trace_id:
            self.trace_id = str(uuid.uuid4())
        if not self.timestamp:
            self.timestamp = datetime.utcnow()


def create_event(
    event_type: EventType | str,
    node: str,
    source: Dict[str, Any],
    payload: Optional[Dict[str, Any]] = None,
    request_consensus: bool = False,
    trace_id: Optional[str] = None,
    timestamp: Optional[datetime] = None,
    priority: Optional[int] = None,
) -> MirrorNodeEvent:
    """
    Helper constructor — ensures trace and timestamp exist.
    """
    ev = MirrorNodeEvent(
        event_type=EventType(event_type),
        node=node,
        source=source,
        payload=payload or {},
        request_consensus=request_consensus,
        trace_id=trace_id,
        timestamp=timestamp,
        priority=priority,
    )
    ev.ensure_metadata()
    return ev
