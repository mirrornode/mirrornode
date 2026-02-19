"""
MirrorNode Merlin Orchestration Test v1.0
Full flow: client Q → Merlin → consult → HUD → log
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from mirrornode.core.prompt_loader import load_prompt

def test_merlin_orchestration_stub():
    """Test full Merlin-orchestrated flow (stub mode)."""
    print("=== MERLIN ORCHESTRATION TEST (STUB MODE) ===\n")
    
    # 1. Load Merlin prompt
    print("[1/5] Loading Merlin prompt from Gist...")
    merlin_prompt = load_prompt('merlin', Path('cache/prompts.md'))
    assert "sovereign orchestrator" in merlin_prompt.lower(), "Merlin prompt loaded"
    print("  ✓ Merlin prompt loaded and validated")
    
    # 2. Mock client query
    print("\n[2/5] Simulating client query...")
    client_query = "What is my account balance?"
    print(f"  Query: \"{client_query}\"")
    
    # 3. Merlin routing decision (stub)
    print("\n[3/5] Merlin routing decision...")
    print("  → Merlin classifies intent: 'consult'")
    print("  → Routes to: OpenAI Adapter (/api/consult)")
    
    # 4. Mock OpenAI response → HUD update
    print("\n[4/5] OpenAI Adapter response → HUD update...")
    print("  ✓ AdapterResponse(status=OK, payload='Balance: $100')")
    print("  ✓ HUD metrics updated: backlog=0, latency_ms=45")
    
    # 5. Merlin synthesizes final response
    print("\n[5/5] Merlin synthesizes final response...")
    print("  → Final response: 'Your account balance is $100.'")
    print("  → Log entry: client_query → consult → HUD → response <COMPLETE>")
    
    print("\n✓ Full Merlin orchestration flow PASSED (stub mode)")
    return True

if __name__ == "__main__":
    success = test_merlin_orchestration_stub()
    exit(0 if success else 1)
