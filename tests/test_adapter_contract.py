import pytest
from mirrornode.core.contracts.adapter_response import (
    AdapterResponse,
    AdapterStatus
)

def test_ok_status_enforces_null_error():
    """OK status must have null error"""
    with pytest.raises(ValueError, match="error must be null"):
        AdapterResponse(
            status=AdapterStatus.OK,
            node_id="test",
            payload={"content": "test"},
            error={"code": "invalid"}
        )

def test_all_statuses_produce_envelope():
    """Every status produces valid envelope"""
    for status in AdapterStatus:
        resp = AdapterResponse(
            status=status,
            node_id="test",
            payload={"content": None},
            error={"code": "test"} if status != AdapterStatus.OK else None
        )
        assert resp is not None
        assert resp.status == status
