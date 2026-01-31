"""
OSIRIS Audit Tool — v0.1.0

Filesystem-first audit utility for inspecting repository structure,
documentation presence, and basic invariants.

This tool is intentionally conservative:
- No mutation
- No deletion
- No automation
- Inventory and signaling only
"""

from __future__ import annotations

import argparse
import json
import os
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Dict, Any


# =========================
# Data Models
# =========================

@dataclass
class Finding:
    id: str
    severity: str  # info | warn | fail
    category: str
    title: str
    description: str
    evidence: List[str]
    recommendation: str | None = None


@dataclass
class AuditResult:
    audit_id: str
    timestamp: str
    tool_version: str
    target_path: str
    status: str
    score: float
    finding_counts: Dict[str, int]
    structure: Dict[str, Any]
    documentation: Dict[str, Any]
    invariants: Dict[str, Any]
    findings: List[Finding] = field(default_factory=list)

    def to_json(self) -> str:
        def convert(obj):
            if isinstance(obj, Finding):
                return asdict(obj)
            if isinstance(obj, list):
                return [convert(i) for i in obj]
            if isinstance(obj, dict):
                return {k: convert(v) for k, v in obj.items()}
            return obj

        payload = {
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
        return json.dumps(payload, indent=2)


# =========================
# Core Audit Logic
# =========================

class Audit:
    TOOL_VERSION = "0.1.0"

    def __init__(self, target: str) -> None:
        self.target = os.path.abspath(target)

    def run(self, strict: bool = False) -> AuditResult:
        audit_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"

        structure = {
            "files_scanned": 0,
            "directories_scanned": 0,
            "top_level_directories": [],
            "missing_expected": [],
        }

        documentation = {
            "readme_present": False,
            "readme_quality": "none",
        }

        invariants = {
            "defined": [],
            "violations": [],
        }

        findings: List[Finding] = []

        # Walk filesystem
        for dirpath, dirnames, filenames in os.walk(self.target):
            structure["directories_scanned"] += 1
            structure["files_scanned"] += len(filenames)

            if dirpath == self.target:
                structure["top_level_directories"] = sorted(dirnames)

                expected = {"README.md", "README"}
                present = set(filenames)
                for exp in expected:
                    if exp not in present and exp.lower() not in [
                        f.lower() for f in present
                    ]:
                        structure["missing_expected"].append(exp)

            for name in filenames:
                if name.lower().startswith("readme"):
                    documentation["readme_present"] = True
                    try:
                        size = os.path.getsize(os.path.join(dirpath, 
name))
                        documentation["readme_quality"] = (
                            "adequate" if size > 500 else "minimal"
                        )
                    except OSError:
                        documentation["readme_quality"] = "unknown"

findings.append(
    Finding(
        id="F-README-01",
        severity="warn",
        category="documentation",
        title="README missing",
        description="README missing at repo root.",
        evidence=[self.target],
        recommendation="Add a root README.",
    )
)

        # Summary calculation
        finding_counts = {
            "info": sum(1 for f in findings if f.severity == "info"),
            "warn": sum(1 for f in findings if f.severity == "warn"),
            "fail": sum(1 for f in findings if f.severity == "fail"),
        }

        if finding_counts["fail"] > 0:
            status = "fail"
            score = 0.0
        elif finding_counts["warn"] > 0:
            status = "warn"
            score = 0.7
        else:
            status = "pass"
            score = 1.0

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


# =========================
# CLI Entrypoint
# =========================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run OSIRIS filesystem 
audit")
    parser.add_argument("--root", required=True, help="Root directory to 
audit")
    parser.add_argument(
        "--mode",
        default="inventory",
        choices=["inventory"],
        help="Audit mode (v0 supports inventory only)",
    )
    parser.add_argument(
        "--output",
        help="Output file (JSON). If omitted, prints to stdout.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as failures",
    )

    args = parser.parse_args()

    audit = Audit(args.root)
    result = audit.run(strict=args.strict)
    output = result.to_json()

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
    else:
        print(output)

