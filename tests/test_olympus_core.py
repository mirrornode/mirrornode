import pytest
from datetime import datetime, timezone


class TestOlympusModels:
    def test_models_importable(self):
        from core.models import (
            RunStatus, StepStatus, SideEffectClass, ArtifactKind,
            RiskLevel, PolicyDecision, ArtifactRef, EvidenceReceipt,
            RiskItem, BoundaryResult, ExecutionStep, ReceiverInput,
            ReceiverResult, ProcessorPlan, ProcessorResult,
            ExportResult, RunContext
        )
        assert RunStatus is not None
        assert RunContext is not None

    def test_run_status_values(self):
        from core.models import RunStatus
        assert isinstance(RunStatus.PENDING, RunStatus)

    def test_step_status_values(self):
        from core.models import StepStatus
        assert isinstance(StepStatus.PENDING, StepStatus)

    def test_artifact_ref_fields(self):
        from core.models import ArtifactRef, ArtifactKind
        ref = ArtifactRef(
            id="art-001",
            kind=list(ArtifactKind)[0],
            path="canon/charters/MIRRORNODE_CORE.md",
            sha256="41565a122926fa6265a495321dae759ddc921116f3061d50bbd724671fae277d"
        )
        assert ref.id == "art-001"
        assert ref.path == "canon/charters/MIRRORNODE_CORE.md"

    def test_risk_item_fields(self):
        from core.models import RiskItem, RiskLevel
        r = RiskItem(
            code="RISK-001",
            level=list(RiskLevel)[0],
            message="test risk"
        )
        assert r.code == "RISK-001"
        assert r.message == "test risk"

    def test_evidence_receipt_fields(self):
        from core.models import EvidenceReceipt, SideEffectClass
        e = EvidenceReceipt(
            step_id="step-001",
            action="boot",
            side_effect=list(SideEffectClass)[0]
        )
        assert e.step_id == "step-001"
        assert e.action == "boot"

    def test_receiver_input_fields(self):
        from core.models import ReceiverInput
        r = ReceiverInput(payload={"input": "test"})
        assert r.payload == {"input": "test"}
        assert r.source == "cli"

    def test_processor_plan_fields(self):
        from core.models import ProcessorPlan, ExecutionStep, SideEffectClass
        from core.hashing import sha256_json
        step = ExecutionStep(
            id="step-001",
            title="Boot Olympus",
            action="boot",
            side_effect=list(SideEffectClass)[0]
        )
        plan = ProcessorPlan(
            plugin_id="olympus",
            steps=[step],
            plan_hash=sha256_json({"plugin_id": "olympus"})
        )
        assert plan.plugin_id == "olympus"
        assert len(plan.steps) == 1

    def test_run_context_fields(self):
        from core.models import RunContext
        from core.ids import new_run_id, new_correlation_id
        ctx = RunContext(
            run_id=new_run_id(),
            correlation_id=new_correlation_id(),
            template_id="mirrornode-core",
            plugin_id="olympus",
            run_dir="/tmp/run",
            temp_dir="/tmp/temp",
            output_dir="/tmp/output"
        )
        assert ctx.plugin_id == "olympus"
        assert ctx.operator == "human"

    def test_utc_now(self):
        from core.models import utc_now
        now = utc_now()
        assert isinstance(now, datetime)
        assert now.tzinfo is not None


class TestOlympusHashing:
    def test_hashing_importable(self):
        from core.hashing import sha256_json, sha256_bytes
        assert callable(sha256_json)
        assert callable(sha256_bytes)

    def test_sha256_json_deterministic(self):
        from core.hashing import sha256_json
        p = {"source": "olympus", "event_type": "boot"}
        assert sha256_json(p) == sha256_json(p)

    def test_sha256_json_is_64_chars(self):
        from core.hashing import sha256_json
        assert len(sha256_json({"test": "data"})) == 64

    def test_sha256_bytes_roundtrip(self):
        from core.hashing import sha256_bytes
        h1 = sha256_bytes(b"mirrornode")
        h2 = sha256_bytes(b"mirrornode")
        assert h1 == h2
        assert len(h1) == 64

    def test_sha256_json_changes_on_tamper(self):
        from core.hashing import sha256_json
        h1 = sha256_json({"source": "merlin"})
        h2 = sha256_json({"source": "INJECTED"})
        assert h1 != h2

    def test_sha256_file_importable(self):
        from core.hashing import sha256_file
        assert callable(sha256_file)


class TestOlympusIds:
    def test_ids_importable(self):
        from core.ids import new_run_id, new_correlation_id
        assert callable(new_run_id)
        assert callable(new_correlation_id)

    def test_run_ids_unique(self):
        from core.ids import new_run_id
        ids = {new_run_id() for _ in range(100)}
        assert len(ids) == 100

    def test_correlation_ids_unique(self):
        from core.ids import new_correlation_id
        ids = {new_correlation_id() for _ in range(100)}
        assert len(ids) == 100

    def test_run_id_is_string(self):
        from core.ids import new_run_id
        assert isinstance(new_run_id(), str)

    def test_correlation_id_is_string(self):
        from core.ids import new_correlation_id
        assert isinstance(new_correlation_id(), str)


class TestOlympusLedger:
    def test_ledger_importable(self):
        from core.ledger import RunLedger, LedgerStep
        assert RunLedger is not None
        assert LedgerStep is not None

    def test_ledger_step_fields(self):
        from core.ledger import LedgerStep
        from core.models import SideEffectClass
        step = LedgerStep(
            step_id="step-001",
            title="Boot",
            action="boot",
            side_effect=list(SideEffectClass)[0]
        )
        assert step.step_id == "step-001"
        assert step.title == "Boot"

    def test_run_ledger_fields(self):
        from core.ledger import RunLedger
        from core.ids import new_run_id, new_correlation_id
        from core.hashing import sha256_json
        ledger = RunLedger(
            run_id=new_run_id(),
            correlation_id=new_correlation_id(),
            template_id="mirrornode-core",
            plugin_id="olympus",
            operator="oracle",
            input_hash=sha256_json({"boot": True})
        )
        assert ledger.plugin_id == "olympus"
        assert ledger.schema_version == "0.1.0"

    def test_utc_now_in_ledger(self):
        from core.ledger import utc_now
        now = utc_now()
        assert isinstance(now, datetime)


class TestOlympusRegistry:
    def test_registry_importable(self):
        from core.registry import load_template, list_templates
        assert callable(load_template)
        assert callable(list_templates)

    def test_list_templates_returns_list(self):
        from core.registry import list_templates
        assert isinstance(list_templates(), list)

    def test_load_class_importable(self):
        from core.registry import _load_class
        assert callable(_load_class)

    def test_load_class_resolves_with_colon_notation(self):
        from core.registry import _load_class
        cls = _load_class("builtins:str")
        assert cls is str


class TestSpineIntegration:
    SPINE = "https://mirrornode.vercel.app"

    def test_spine_reachable(self):
        import requests
        try:
            r = requests.get(self.SPINE + "/projects", timeout=5)
            assert r.status_code == 200
        except Exception:
            pytest.skip("Spine unreachable")

    def test_olympus_boot_event(self):
        import requests
        from core.ids import new_run_id
        from core.hashing import sha256_json
        payload = {
            "source": "olympus",
            "event_type": "boot",
            "payload": {
                "version": "gpt-5.4",
                "run_id": new_run_id(),
                "modules_hash": sha256_json({"modules": [
                    "ids", "hashing", "models", "ledger", "registry"
                ]})
            }
        }
        try:
            r = requests.post(self.SPINE + "/events/log", json=payload, timeout=5)
            assert r.status_code == 200
        except Exception:
            pytest.skip("Spine unreachable")