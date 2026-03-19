from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field
from olympus.core.models import (
    ArtifactRef, BoundaryResult, EvidenceReceipt,
    RiskItem, RunStatus, SideEffectClass, StepStatus,
)

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class LedgerStep(BaseModel):
    step_id: str
    title: str
    action: str
    status: StepStatus = StepStatus.PENDING
    started_at: datetime | None = None
    ended_at: datetime | None = None
    duration_ms: int | None = None
    side_effect: SideEffectClass = SideEffectClass.NONE
    bounded: bool = True
    timeout_seconds: int = 300
    approval_required: bool = False
    policy_result: BoundaryResult | None = None
    input_hash: str | None = None
    output_hash: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

class RunLedger(BaseModel):
    schema_version: str = "0.1.0"
    run_id: str
    correlation_id: str
    template_id: str
    plugin_id: str
    operator: str
    status: RunStatus = RunStatus.PENDING
    started_at: datetime = Field(default_factory=utc_now)
    ended_at: datetime | None = None
    input_hash: str
    plan_hash: str | None = None
    output_hash: str | None = None
    manifest_sha256: str | None = None
    side_effect_summary: dict[str, int] = Field(default_factory=dict)
    risk_items: list[RiskItem] = Field(default_factory=list)
    steps: list[LedgerStep] = Field(default_factory=list)
    evidence: list[EvidenceReceipt] = Field(default_factory=list)
    artifacts: list[ArtifactRef] = Field(default_factory=list)
    governance: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
