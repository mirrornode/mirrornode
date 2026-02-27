from dotenv import load_dotenv
load_dotenv()
"""
MirrorNode Credential Verifier v1.0
Per-agent endpoint + credential health check.
"""
import os
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class CredentialStatus:
    """Single credential check result."""
    agent: str
    service: str
    status: str  # "OK" | "MISSING" | "INVALID"
    error: Optional[str] = None

def check_openai() -> CredentialStatus:
    """Verify OpenAI API key."""
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return CredentialStatus("OpenAI Adapter", "OpenAI", "MISSING", "OPENAI_API_KEY not set")
    if not key.startswith("sk-"):
        return CredentialStatus("OpenAI Adapter", "OpenAI", "INVALID", "Key format incorrect")
    return CredentialStatus("OpenAI Adapter", "OpenAI", "OK")

def check_stripe() -> CredentialStatus:
    """Verify Stripe API key."""
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        return CredentialStatus("Stripe Lane", "Stripe", "MISSING", "STRIPE_SECRET_KEY not set")
    if not (key.startswith("sk_test_") or key.startswith("sk_live_")):
        return CredentialStatus("Stripe Lane", "Stripe", "INVALID", "Key format incorrect")
    return CredentialStatus("Stripe Lane", "Stripe", "OK")

def check_all() -> List[CredentialStatus]:
    """Run all credential checks."""
    return [
        check_openai(),
        check_stripe(),
        # Add chain watchers when endpoints known
    ]

def print_report(results: List[CredentialStatus]):
    """Print credential health report."""
    print("=== MIRRORNODE CREDENTIAL HEALTH ===")
    for r in results:
        status_icon = "✓" if r.status == "OK" else "✗"
        print(f"{status_icon} {r.agent} ({r.service}): {r.status}")
        if r.error:
            print(f"  └─ {r.error}")
    print()
    ok_count = sum(1 for r in results if r.status == "OK")
    print(f"{ok_count}/{len(results)} credentials OK")

if __name__ == "__main__":
    results = check_all()
    print_report(results)
    exit(0 if all(r.status == "OK" for r in results) else 1)
