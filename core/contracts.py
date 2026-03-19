from __future__ import annotations
from abc import ABC, abstractmethod
from pydantic import BaseModel
from olympus.core.models import (
    ExportResult, ProcessorPlan, ProcessorResult,
    ReceiverInput, ReceiverResult, RunContext,
)

class ReceiverContract(ABC):
    plugin_id: str
    input_model: type[BaseModel]

    @abstractmethod
    def receive(self, raw: ReceiverInput, ctx: RunContext) -> ReceiverResult:
        raise NotImplementedError

class ProcessorContract(ABC):
    plugin_id: str

    @abstractmethod
    def plan(self, received: ReceiverResult, ctx: RunContext) -> ProcessorPlan:
        raise NotImplementedError

    @abstractmethod
    def execute(self, received: ReceiverResult, plan: ProcessorPlan, ctx: RunContext) -> ProcessorResult:
        raise NotImplementedError

class ExporterContract(ABC):
    plugin_id: str

    @abstractmethod
    def export(self, received: ReceiverResult, plan: ProcessorPlan, result: ProcessorResult, ctx: RunContext) -> ExportResult:
        raise NotImplementedError
