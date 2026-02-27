.PHONY: bridge sweep verify clean

bridge:
	source .venv/bin/activate && \
	python -m uvicorn "mirrornode.core.bridge.main:app" --reload --port 8000

sweep:
	source .venv/bin/activate && \
	python -m mirrornode sweep --out artifacts

verify:
	source .venv/bin/activate && \
	python -m mirrornode sweep --out artifacts --oracle off --ray validate && \
	cat artifacts/$$(ls -t artifacts | head -1)/mirror.md

clean:
	rm -rf artifacts/sweep_*
