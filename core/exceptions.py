from __future__ import annotations

class OlympusError(Exception): pass
class PolicyDeniedError(OlympusError): pass
class ApprovalRequiredError(OlympusError): pass
class BoundaryViolationError(OlympusError): pass
class PluginNotFoundError(OlympusError): pass
class TemplateNotFoundError(OlympusError): pass
