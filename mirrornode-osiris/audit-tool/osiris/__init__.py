"""
OSIRIS Audit Tool package.

This package provides a command‑line interface (`osiris audit`) for inspecting
repositories and producing deterministic, explainable audit reports.

The tool is currently in an early, minimal state. See the `README.md` at the
root of the repository for more information.
"""

__all__ = ["Audit", "AuditResult"]

from .audit import Audit, AuditResult