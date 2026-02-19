import requests
import re
from typing import Dict, Optional
from pathlib import Path

GIST_URL = "https://gist.githubusercontent.com/mirrornode/dae6a79f28dd78258d5f58e3c3ecc5cd/raw"  # Raw MD

def fetch_gist() -> str:
    """Fetch raw Gist content."""
    try:
        resp = requests.get(GIST_URL, timeout=5)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        raise RuntimeError(f"Gist fetch failed: {e}")

def parse_prompts(md_content: str) -> Dict[str, str]:
    """Parse ### AgentName\n```\nprompt\n``` → {'agentname': 'prompt'}."""
    prompts = {}
    sections = re.split(r'^###\s+([A-Z][^`\n]+)', md_content, flags=re.MULTILINE)
    for i in range(1, len(sections), 2):
        name = sections[i].strip().lower().replace(' ', '_').replace('-', '_')
        prompt_block = re.search(r'```\n(.*?)\n```', sections[i+1], re.DOTALL)
        if prompt_block:
            prompts[name] = prompt_block.group(1).strip()
    return prompts

def load_prompt(agent_name: str, cache_file: Optional[Path] = None) -> str:
    """
    Load prompt for agent.
    Caches to file for offline Ray; refreshes from Gist.
    """
    if cache_file and cache_file.exists():
        with open(cache_file, 'r') as f:
            cached = f.read()
        prompts = parse_prompts(cached)
        if agent_name in prompts:
            return prompts[agent_name]
    
    md = fetch_gist()
    prompts = parse_prompts(md)
    
    if agent_name not in prompts:
        raise ValueError(f"Prompt '{agent_name}' not in Gist.")
    
    if cache_file:
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'w') as f:
            f.write(md)
    
    return prompts[agent_name]
