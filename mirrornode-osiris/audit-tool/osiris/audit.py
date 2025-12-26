"""
Core audit logic for the OSIRIS Audit Tool v0.

This module defines two primary classes:

* `Audit` — encapsulates the process of scanning a target directory and
  producing an `AuditResult`. For version 0 the checks are intentionally
  minimal, but the structure can be extended in future versions.
* `AuditResult` — a data container for audit metadata, summary information,
  structural data and individual findings. Provides helpers for converting
  the result into JSON and human‑readable summaries as well as computing
  exit codes based on severity levels.
"""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Dict, Any


@dataclass
class Finding:
    """Represents a single audit finding."""
    id: str
    severity: str  # info | warn | fail
    category: str
    title: str
    description: str
    evidence: List[str]
    recommendation: str | None = None


@dataclass
class AuditResult:
    """Container for the results of an audit run."""
    audit_id: str
    timestamp: str
    tool_version: str
    target_path: str
    status: str  # pass | warn | fail
    score: float
    finding_counts: Dict[str, int]
    structure: Dict[str, Any]
    documentation: Dict[str, Any]
    invariants: Dict[str, Any]
    findings: List[Finding] = field(default_factory=list)

    def to_json(self) -> str:
        """Serialize the audit result to a JSON string following the schema."""
        # Convert dataclasses and nested structures to dicts
        def convert(obj):
            if isinstance(obj, Finding):
                return asdict(obj)
            if isinstance(obj, list):
                return [convert(i) for i in obj]
            if isinstance(obj, dict):
                return {k: convert(v) for k, v in obj.items()}
            return obj

        data = {
            "audit": {
                "id": self.audit_id,
                "timestamp": self.timestamp,
                "tool_version": self.tool_version,
                "target": {
                    "path": self.target_path,
                    "type": "filesystem",
                },
            },
            "summary": {
                "status": self.status,
                "score": round(self.score, 2),
                "finding_counts": self.finding_counts,
            },
            "structure": self.structure,
            "documentation": self.documentation,
            "invariants": self.invariants,
            "findings": convert(self.findings),
        }
        return json.dumps(data, indent=2)

    def to_summary(self) -> str:
        """Render a human-readable summary of the audit result."""
        lines = []
        lines.append("OSIRIS AUDIT — SUMMARY")
        lines.append("")
        lines.append(f"Target: {self.target_path}")
        lines.append(f"Status: {self.status.upper()}")
        lines.append(f"Score: {round(self.score, 2)}")
        lines.append("")
        lines.append("Findings:")
        for severity in ["info", "warn", "fail"]:
            count = self.finding_counts.get(severity, 0)
            if count:
                lines.append(f"- {count} {severity} finding{'s' if count != 1 else ''}")
        if not any(self.finding_counts.values()):
            lines.append("- None")
        lines.append("")
        # Primary concern: first non-info finding title, if any
        primary = next(
            (f.title for f in self.findings if f.severity in {"warn", "fail"}),
            None,
        )
        if primary:
            lines.append(f"Primary Concern:\n{primary}")
        else:
            lines.append("No concerns detected.")
        return "\n".join(lines)

    def exit_code(self, strict: bool) -> int:
        """Determine the exit code based on severity and strict mode."""
        if self.status == "fail":
            return 2
        if self.status == "warn":
            return 2 if strict else 1
        return 0


class Audit:
    """
    Perform an audit of a target repository or directory.

    This class encapsulates the logic for scanning a directory, collecting
    structural and documentation metrics, evaluating invariants and producing
    a list of findings. For v0, the checks are intentionally minimal.
    """

    TOOL_VERSION = "0.1.0"

    def __init__(self, target: str, config_path: str | None = None) -> None:
        self.target = os.path.abspath(target)
        self.config_path = config_path

    def run(self, strict: bool = False) -> AuditResult:
        """Run the audit and return an AuditResult."""
        audit_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"

        # Perform minimal checks: check for README presence and count files
        structure = {
            "files_scanned": 0,
            "directories_scanned": 0,
            "missing_expected": [],
            "unexpected_present": [],
        }
        documentation = {
            "readme_present": False,
            "readme_quality": "none",
            "missing_docs": [],
        }
        invariants: Dict[str, Any] = {
            "defined": [],
            "violations": [],
        }
        findings: List[Finding] = []

        # Walk the directory tree
        for dirpath, dirnames, filenames in os.walk(self.target):
            structure["directories_scanned"] += 1
            structure["files_scanned"] += len(filenames)
            # Check for README (case-insensitive)
            for name in filenames:
                if name.lower().startswith("readme"):
                    documentation["readme_present"] = True
                    # Simple quality assessment: minimal vs adequate
                    readme_path = os.path.join(dirpath, name)
                    try:
                        size = os.path.getsize(readme_path)
                    except OSError:
                        size = 0
                    documentation["readme_quality"] = (
                        "adequate" if size > 500 else "minimal"
                    )
            # Only check top level for expected files
            if dirpath == self.target:
                expected = {"README.md", "README"}
                present = set(filenames)
                for exp in expected:
                    if exp not in present and exp.lower() not in [f.lower() for f in present]:
                        structure["missing_expected"].append(exp)

        # If README missing entirely
        if not documentation["readme_present"]:
            findings.append(
                Finding(
                    id="F-README-01",
                    severity="warn",
                    category="docs",
                    title="README missing",
                    description=(
                        "No README file found at the top level of the target. A README provides essential context."
                    ),
                    evidence=[self.target],
                    recommendation="Add a README to describe the project and its usage.",
                )
            )
            documentation["missing_docs"].append("README")

        # Compute status and score based on findings
        finding_counts = {"info": 0, "warn": 0, "fail": 0}
        for f in findings:
            finding_counts[f.severity] += 1

        if finding_counts["fail"] > 0:
            status = "fail"
            base_score = 0.0
        elif finding_counts["warn"] > 0:
            status = "warn"
            base_score = 0.7
        else:
            status = "pass"
            base_score = 1.0

        # Score can be refined in future versions
        score = base_score

        return AuditResult(
            audit_id=audit_id,
            timestamp=timestamp,
            tool_version=self.TOOL_VERSION,
            target_path=self.target,
            status=status,
            score=score,
            finding_counts=finding_counts,
            structure=structure,
            documentation=documentation,
            invariants=invariants,
            findings=findings,
        )