"""
THOTH Unified Engine
core/engines/thoth.py

Three aspects, one engine. Mode selector determines reasoning pattern.
SECURITY: Pure functions only. Zero filesystem writes. Zero side effects.

Modes:
  prime  — Records truth, structure, invariants. Documentation specialist.
  shadow — Recursive pattern mining. Historical tracking. Drift detection.
  sys    — Logistics. Build verification. Sanity checks. Does it work?
  auto   — Selects mode based on input characteristics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Literal
import re


# ── Types ────────────────────────────────────────────────────────────────────

ThothMode = Literal["prime", "shadow", "sys", "auto"]


class InputClass(Enum):
    STRUCTURAL   = "structural"   # Architecture, contracts, invariants
    HISTORICAL   = "historical"   # Patterns over time, drift, evolution
    OPERATIONAL  = "operational"  # Build tasks, validation, execution checks
    AMBIGUOUS    = "ambiguous"    # Let auto decide


@dataclass
class ThothResult:
    mode_used:   ThothMode
    input_class: InputClass
    output:      Any
    confidence:  float        # 0.0–1.0
    warnings:    list[str] = field(default_factory=list)
    metadata:    dict        = field(default_factory=dict)


# ── THOTH Engine ─────────────────────────────────────────────────────────────

class Thoth:
    """
    Unified THOTH engine. Replaces three overlapping instances.

    Usage:
        thoth = Thoth(mode="prime")
        result = thoth.process({"type": "invariant", "data": ...})

        thoth = Thoth(mode="auto")
        result = thoth.process(raw_input)
    """

    # Keywords that signal each mode
    _PRIME_SIGNALS  = {"invariant", "truth", "canonical", "document", "record",
                       "define", "contract", "schema", "spec", "constant"}
    _SHADOW_SIGNALS = {"pattern", "history", "drift", "evolution", "recurring",
                       "trace", "delta", "change", "over time", "archaeology"}
    _SYS_SIGNALS    = {"build", "validate", "verify", "check", "deploy", "test",
                       "health", "ready", "run", "scaffold", "sanity", "status"}

    def __init__(self, mode: ThothMode = "auto") -> None:
        self.mode = mode

    # ── Public ───────────────────────────────────────────────────────────────

    def process(self, input_data: Any) -> ThothResult:
        """Main entry point. Routes to correct aspect based on mode."""
        input_class = self._classify(input_data)

        active_mode = self.mode
        if active_mode == "auto":
            active_mode = self._select_mode(input_class, input_data)

        dispatch = {
            "prime":  self._prime,
            "shadow": self._shadow,
            "sys":    self._sys,
        }

        output, confidence, warnings, metadata = dispatch[active_mode](input_data)

        return ThothResult(
            mode_used=active_mode,
            input_class=input_class,
            output=output,
            confidence=confidence,
            warnings=warnings,
            metadata=metadata,
        )

    # ── Mode: PRIME ──────────────────────────────────────────────────────────

    def _prime(self, data: Any) -> tuple:
        """
        THOTH-PRIME: Records truth, structure, invariants.
        Never speculates. Only documents verified patterns.
        Enforces coherence across terminology.
        """
        warnings = []
        metadata = {"aspect": "PRIME", "function": "truth_recording"}

        if isinstance(data, dict):
            output = self._prime_dict(data, warnings)
        elif isinstance(data, str):
            output = self._prime_text(data, warnings)
        elif isinstance(data, list):
            output = {"items": len(data), "types": list({type(i).__name__ for i in data})}
        else:
            output = {"type": type(data).__name__, "value": str(data)}
            warnings.append("Non-standard input type — structural record only")

        confidence = 1.0 if not warnings else 0.75
        return output, confidence, warnings, metadata

    def _prime_dict(self, data: dict, warnings: list) -> dict:
        record = {
            "structure": {k: type(v).__name__ for k, v in data.items()},
            "keys":      list(data.keys()),
            "depth":     self._dict_depth(data),
        }
        if "type" in data:
            record["canonical_type"] = data["type"]
        if "version" in data:
            record["version"] = data["version"]
        undefined = [k for k, v in data.items() if v is None]
        if undefined:
            warnings.append(f"Undefined fields: {undefined}")
        return record

    def _prime_text(self, text: str, warnings: list) -> dict:
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        return {
            "length":    len(text),
            "sentences": len(sentences),
            "summary":   sentences[0] if sentences else "",
            "keywords":  self._extract_keywords(text),
        }

    # ── Mode: SHADOW ─────────────────────────────────────────────────────────

    def _shadow(self, data: Any) -> tuple:
        """
        THOTH-SHADOW: Pattern mining. Drift detection. Historical tracking.
        Traces how things became what they are.
        Connects past decisions to present state.
        """
        warnings = []
        metadata = {"aspect": "SHADOW", "function": "pattern_mining"}

        if isinstance(data, list):
            output = self._shadow_sequence(data, warnings)
        elif isinstance(data, dict):
            output = self._shadow_dict(data, warnings)
        elif isinstance(data, str):
            output = self._shadow_text(data, warnings)
        else:
            output = {"pattern": "unrecognized", "data": str(data)}
            warnings.append("Cannot mine patterns from non-iterable input")

        confidence = 0.85 if not warnings else 0.60
        return output, confidence, warnings, metadata

    def _shadow_sequence(self, items: list, warnings: list) -> dict:
        if not items:
            warnings.append("Empty sequence — no patterns to mine")
            return {"pattern": "null", "drift": None}

        types    = [type(i).__name__ for i in items]
        type_set = set(types)
        drift    = len(type_set) > 1

        return {
            "length":        len(items),
            "type_drift":    drift,
            "type_pattern":  types if len(items) <= 10 else types[:5] + ["..."] + types[-3:],
            "recurring":     self._find_recurring(items),
            "delta_start_end": {
                "first": str(items[0])[:80],
                "last":  str(items[-1])[:80],
            },
        }

    def _shadow_dict(self, data: dict, warnings: list) -> dict:
        return {
            "key_pattern":   list(data.keys()),
            "value_types":   {k: type(v).__name__ for k, v in data.items()},
            "nested_depth":  self._dict_depth(data),
            "null_fields":   [k for k, v in data.items() if v is None],
            "pattern_score": self._pattern_coherence(data),
        }

    def _shadow_text(self, text: str, warnings: list) -> dict:
        words   = text.lower().split()
        unique  = set(words)
        freq    = {w: words.count(w) for w in unique if words.count(w) > 1}
        top     = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "word_count":   len(words),
            "unique_words": len(unique),
            "repetition":   top,
            "density":      round(len(unique) / len(words), 3) if words else 0,
        }

    # ── Mode: SYS ────────────────────────────────────────────────────────────

    def _sys(self, data: Any) -> tuple:
        """
        THOTH-SYS: Logistics. Build verification. Sanity checks.
        Focuses on 'does it work?'
        Validates before recommending execution.
        """
        warnings = []
        metadata = {"aspect": "SYS", "function": "validation"}

        if isinstance(data, dict):
            output = self._sys_validate(data, warnings)
        elif isinstance(data, list):
            output = self._sys_checklist(data, warnings)
        elif isinstance(data, str):
            output = self._sys_parse_command(data, warnings)
        else:
            output = {"status": "UNKNOWN", "input_type": type(data).__name__}
            warnings.append("Non-standard input — manual review required")

        status     = "PASS" if not warnings else "WARN"
        confidence = 1.0   if not warnings else 0.70
        metadata["status"] = status

        return output, confidence, warnings, metadata

    def _sys_validate(self, data: dict, warnings: list) -> dict:
        checks = {}

        # Required fields check
        if "type" not in data:
            warnings.append("Missing 'type' field — schema unclear")
            checks["has_type"] = False
        else:
            checks["has_type"] = True

        # Null value check
        nulls = [k for k, v in data.items() if v is None]
        if nulls:
            warnings.append(f"Null values in: {nulls}")
        checks["null_fields"] = nulls

        # Depth sanity
        depth = self._dict_depth(data)
        if depth > 5:
            warnings.append(f"Deep nesting ({depth} levels) — consider flattening")
        checks["depth"] = depth


        # Check for missing paths/files
        missing = data.get("missing_paths", []) + data.get("missing_files", [])
        if missing:
            warnings.append(f"Missing: {missing}")
            checks["missing"] = missing
        else:
            checks["missing"] = []
        checks["field_count"] = len(data)
        checks["ready"]       = len(warnings) == 0

        return checks

    def _sys_checklist(self, items: list, warnings: list) -> dict:
        results = []
        for i, item in enumerate(items):
            if item is None:
                warnings.append(f"Item {i} is None")
                results.append({"index": i, "status": "NULL"})
            else:
                results.append({"index": i, "status": "OK", "type": type(item).__name__})

        return {
            "total":  len(items),
            "passed": sum(1 for r in results if r["status"] == "OK"),
            "failed": sum(1 for r in results if r["status"] != "OK"),
            "items":  results,
        }

    def _sys_parse_command(self, text: str, warnings: list) -> dict:
        text_lower = text.lower()

        action = "unknown"
        for keyword in ["build", "deploy", "test", "validate", "scaffold",
                        "check", "verify", "run", "start", "stop"]:
            if keyword in text_lower:
                action = keyword
                break

        if action == "unknown":
            warnings.append("No recognizable action verb found")

        return {
            "action":    action,
            "raw":       text,
            "safe":      not any(w in text_lower for w in ["rm -rf", "drop", "delete all"]),
            "ready":     action != "unknown",
        }

    # ── Auto Mode ────────────────────────────────────────────────────────────

    def _classify(self, data: Any) -> InputClass:
        if isinstance(data, str):
            lower = data.lower()
            if any(s in lower for s in self._PRIME_SIGNALS):
                return InputClass.STRUCTURAL
            if any(s in lower for s in self._SHADOW_SIGNALS):
                return InputClass.HISTORICAL
            if any(s in lower for s in self._SYS_SIGNALS):
                return InputClass.OPERATIONAL
            return InputClass.AMBIGUOUS

        if isinstance(data, dict):
            keys = " ".join(data.keys()).lower()
            if any(s in keys for s in self._PRIME_SIGNALS):
                return InputClass.STRUCTURAL
            if any(s in keys for s in self._SHADOW_SIGNALS):
                return InputClass.HISTORICAL
            return InputClass.OPERATIONAL   # dicts default to sys validation

        if isinstance(data, list):
            return InputClass.HISTORICAL    # sequences → pattern mining

        return InputClass.AMBIGUOUS

    def _select_mode(self, input_class: InputClass, data: Any) -> ThothMode:
        mapping = {
            InputClass.STRUCTURAL:  "prime",
            InputClass.HISTORICAL:  "shadow",
            InputClass.OPERATIONAL: "sys",
            InputClass.AMBIGUOUS:   "prime",   # When uncertain, record truth
        }
        return mapping[input_class]

    # ── Utilities ─────────────────────────────────────────────────────────────

    def _dict_depth(self, d: Any, depth: int = 0) -> int:
        if not isinstance(d, dict):
            return depth
        if not d:
            return depth + 1
        return max(self._dict_depth(v, depth + 1) for v in d.values())

    def _extract_keywords(self, text: str) -> list[str]:
        stop = {"the", "a", "an", "is", "in", "of", "and", "to", "for", "with"}
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        return list(dict.fromkeys(w for w in words if w not in stop))[:10]

    def _find_recurring(self, items: list) -> list:
        seen = {}
        for item in items:
            key = str(item)[:50]
            seen[key] = seen.get(key, 0) + 1
        return [k for k, v in seen.items() if v > 1]

    def _pattern_coherence(self, data: dict) -> float:
        if not data:
            return 0.0
        null_ratio = sum(1 for v in data.values() if v is None) / len(data)
        return round(1.0 - null_ratio, 2)


# ── Convenience constructors ──────────────────────────────────────────────────

def thoth_prime()  -> Thoth: return Thoth(mode="prime")
def thoth_shadow() -> Thoth: return Thoth(mode="shadow")
def thoth_sys()    -> Thoth: return Thoth(mode="sys")
def thoth_auto()   -> Thoth: return Thoth(mode="auto")


# ── CLI smoke test ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    samples = [
        ("prime",  {"type": "invariant", "name": "143_pattern", "value": None}),
        ("shadow", ["event_a", "event_b", "event_a", "event_c"]),
        ("sys",    {"type": "build_target", "path": "core/engines/thoth.py"}),
        ("auto",   "scaffold the unified THOTH engine and validate directory structure"),
    ]

    for mode, data in samples:
        t      = Thoth(mode=mode)
        result = t.process(data)
        print(f"\n[{result.mode_used.upper()}] class={result.input_class.value} confidence={result.confidence}")
        print(json.dumps(result.output, indent=2, default=str))
        if result.warnings:
            print(f"  ⚠️  {result.warnings}")
