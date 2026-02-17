#!/bin/bash
echo "🐍 Setting up MirrorNode Environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install pytest pydantic  # Pydantic is great for future schema hardening
echo "✅ Environment Ready. Run 'source .venv/bin/activate' to start."
