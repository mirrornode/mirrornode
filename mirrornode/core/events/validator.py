from typing import Tuple
from mirrornode.core.events.schema import MirrorNodeEvent, EventType


def validate_event(event: MirrorNodeEvent) -> Tuple[bool, str]:
    """
    Basic validation ensuring required fields exist and types are sane.
    Returns (is_valid, message).
    """
    if not isinstance(event, MirrorNodeEvent):
        return False, "Provided object is not a MirrorNodeEvent."

    if not event.node or not isinstance(event.node, str):
        return False, "Missing or invalid 'node'."

    if not event.source or not isinstance(event.source, dict):
        return False, "Missing or invalid 'source'."

    required_source_keys = {"node", "surface", "origin"}
    if not required_source_keys.issubset(set(event.source.keys())):
        return False, f"source must include keys: {required_source_keys}"

    # event_type is enforced by Pydantic Enum, but check for safety
    if not isinstance(event.event_type, EventType):
        return False, "Invalid event_type."

    # payload must be a dict
    if not isinstance(event.payload, dict):
        return False, "payload must be a dict."

    # priority if present must be int
    if event.priority is not None and not isinstance(event.priority, int):
        return False, "priority must be an integer if provided."

    return True, "ok"

