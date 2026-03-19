from __future__ import annotations
import importlib
from pathlib import Path
from typing import Any
import yaml

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
POLICIES_DIR = Path(__file__).parent.parent / "policies"

def _load_class(dotted_path: str) -> Any:
    module_path, class_name = dotted_path.rsplit(":", 1)
    module = importlib.import_module(module_path)
    return getattr(module, class_name)

def load_template(template_id: str) -> dict[str, Any]:
    path = TEMPLATES_DIR / f"{template_id}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Template not found: {template_id}")
    tmpl = yaml.safe_load(path.read_text())
    tmpl["receiver_instance"] = _load_class(tmpl["receiver"])()
    tmpl["processor_instance"] = _load_class(tmpl["processor"])()
    tmpl["exporter_instance"] = _load_class(tmpl["exporter"])()
    return tmpl

def list_templates() -> list[str]:
    return [p.stem for p in TEMPLATES_DIR.glob("*.yaml")]
