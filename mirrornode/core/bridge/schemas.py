"""
MIRRORNODE Data Schemas
Extended schemas for API endpoints

Authority: THOTH Security Commander  
Date: 2025-01-09
"""
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional
from uuid import UUID, uuid4
import json

class AuditRequest(BaseModel):
    """
    Osiris audit job submission.
    
    Used by Osiris HUD to submit audit requests to the Oracle mesh.
    Includes validation to prevent DoS attacks via oversized configs.
    """
    trace_id: UUID = Field(default_factory=uuid4)
    event: str = Field(
        ...,
        pattern=r'^[a-z_]+$',  # Whitelist format: lowercase + underscores only
        max_length=100,
        description="Audit event type (e.g., 'pipeline_test', 'security_scan')"
    )
    pipeline_config: Dict[str, Any] = Field(
        ...,
        description="Audit pipeline configuration"
    )
    
    @validator('pipeline_config')
    def validate_config_size(cls, v):
        """
        Prevent DoS via oversized configs.
        Limit: 10KB JSON serialized size.
        """
        config_json = json.dumps(v)
        if len(config_json) > 10000:
            raise ValueError("pipeline_config exceeds 10KB limit")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "trace_id": "123e4567-e89b-12d3-a456-426614174000",
                "event": "security_scan",
                "pipeline_config": {
                    "target": "oracle_mesh",
                    "checks": ["auth", "rate_limit", "signature"]
                }
            }
        }

class AuditResponse(BaseModel):
    """
    Response from audit submission.
    """
    trace_id: UUID
    status: str  # "queued" | "processing" | "completed" | "failed"
    timestamp: str
    message: Optional[str] = None
