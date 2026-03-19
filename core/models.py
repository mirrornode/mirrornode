from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class RunStatus(str, Enum):
    PENDING = "pending"
    PLANNED = "planned"
    AWAITING_APPROVAL = "awaiting_approval"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"

class StepStatus(str, Enum):
    PENDING = "pending"
    SKIPPED = "skipped"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    BLOCKED = "blocked"

class SideEffectClass(str, Enum):
    NONE = "none"
    NETWORK_READ = "network_read"
    NETWORK_WRITE = "network_write"
    FILESYSTEM_READ = "filesystem_read"
    FILESYSTEM_WRITE_TEMP = "filesystem_write_temp"
    FILESYSTEM_WRITE_OUTPUT = "filesystem_write_output"
    SUBPROCESS_READONLY = "subprocess_readonly"
    SUBPROCESS_MUTATING = "subprocess_mutating"
    SECRET_READ = "secret_read"
    HUMAN_APPROVAL = "human_approval"

class ArtifactKind(str, Enum):
    JSON = "json"
    TEXT = "text"
    MARKDOWN = "markdown"
    PDF = "pdf"
    HTML = "html"
    DIRECTORY = "directory"
    LOG = "log"
    MANIFEST = "manifest"

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class PolicyDecision(str, Enum):
    ALLOW = "allow"
    REQUIRE_APPROVAL = "require_approval"
    DENY = "deny"

class ArtifactRef(BaseModel):
    id: str
    kind: ArtifactKind
    path: str
    sha256: str
    bytes: int | None = None
    description: str | None = None

class EvidenceReceipt(BaseModel):
    step_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    action: str
    side_effect: SideEffectClass
    subject: str | None = None
    result_sha256: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

class RiskItem(BaseModel):
    code: str
    level: RiskLevel
    message: str
    step_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

class BoundaryResult(BaseModel):
    decision: PolicyDecision
    reason: str
    metadata: dict[str, Any] = Field(default_factory=dict)

class ExecutionStep(BaseModel):
    id: str
    title: str
    description: str = ""
    action: str
    side_effect: SideEffectClass = SideEffectClass.NONE
    bounded: bool = True
    timeout_seconds: int = 300
    max_retries: int = 0
    requires_approval: bool = False
    inputs: dict[str, Any] = Field(default_factory=dict)
    outputs: dict[str, Any] = Field(default_factory=dict)

class ReceiverInput(BaseModel):
    source: str = "cli"
    payload: dict[str, Any]

class ReceiverResult(BaseModel):
    plugin_id: str
    normalized_input: dict[str, Any]
    display_input: dict[str, Any]
    input_hash: str

class ProcessorPlan(BaseModel):
    plugin_id: str
    steps: list[ExecutionStep]
    plan_hash: str
    risk_items: list[RiskItem] = Field(default_factory=list)

class ProcessorResult(BaseModel):
    plugin_id: str
    status: RunStatus
    outputs: dict[str, Any] = Field(default_factory=dict)
    artifacts: list[ArtifactRef] = Field(default_factory=list)
    evidence: list[EvidenceReceipt] = Field(default_factory=list)
    step_results: dict[str, Any] = Field(default_factory=dict)

class ExportResult(BaseModel):
    plugin_id: str
    status: RunStatus
    bundle_dir: str
    artifacts: list[ArtifactRef]
    manifest_sha256: str
    summary: dict[str, Any] = Field(default_factory=dict)

class RunContext(BaseModel):
    run_id: str
    correlation_id: str
    template_id: str
    plugin_id: str
    operator: str = "human"
    dry_run: bool = False
    run_dir: str
    temp_dir: str
    output_dir: str
    started_at: datetime = Field(default_factory=utc_now)
    metadata: dict[str, Any] = Field(default_factory=dict)
