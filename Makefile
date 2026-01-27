# MIRRORNODE CANON — OPERATOR CONTROL SURFACE
# v1.0.0

SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c
MAKEFLAGS += --warn-undefined-variables
.PHONY: help bootstrap charter audit index halt freeze clean status

CANON_ROOT := $(shell pwd)
LOGS := $(CANON_ROOT)/logs
DOSS := $(CANON_ROOT)/canon/dossiers

help:
	@echo "MIRRORNODE CANON — Available Commands"
	@echo "  make bootstrap   — Establish canon directories + README"
	@echo "  make charter     — Lock Lucian Prime charter"
	@echo "  make audit REPO= — Audit a GitHub repo"
	@echo "  make index ORG=  — Index GitHub org repos"
	@echo "  make halt        — Mandatory execution pause"
	@echo "  make freeze      — Tag canon v1.0.0"
	@echo "  make clean       — Safe cleanup (logs only)"
	@echo "  make status      — Current canon state"

bootstrap:
	@./canon/scripts/bootstrap.sh

charter:
	@./canon/scripts/charter_lucian.sh

audit:
ifndef REPO
	$(error REPO required: make audit REPO=https://github.com/mirrornode/mirrornode)
endif
	@mkdir -p "$(DOSS)"
	@./canon/scripts/audit.sh "$(REPO)"

index:
ifndef ORG
	$(error ORG required: make index ORG=mirrornode)
endif
	@mkdir -p "$(CANON_ROOT)/canon/index"
	@./canon/scripts/index.sh "$(ORG)"

halt:
	@./canon/scripts/halt.sh

freeze:
	@echo "🔒 FREEZING CANON v1.0.0"
	git add canon/ Makefile
	git commit -m "Canon v1.0.0: constitutional freeze" || true
	git tag -a v1.0.0-canon -m "Canon v1.0.0 governance freeze"
	git push origin main --tags
	echo "v1.0.0" > canon/version
	git add canon/version
	git commit -m "Lock canon version"
	git push origin main
	@echo "✓ Canon v1.0.0 tagged and frozen"

clean:
	@rm -rf logs/*
	@echo "✓ Logs cleared"

status:
	@echo "📊 CANON STATUS"
	@echo "Root: $(CANON_ROOT)"
	@echo "Version: $$(cat canon/version 2>/dev/null || echo "unfrozen")"
	@echo "Scripts: $$(ls canon/scripts/*.sh 2>/dev/null | wc -l)/5"
	@echo "Charters: $$(ls canon/charters/ 2>/dev/null | wc -l || echo 0)"
	@echo "Dossiers: $$(ls canon/dossiers/ 2>/dev/null | wc -l || echo 0)"
	@echo "Git: $$(git status --porcelain | wc -l) uncommitted changes"
	@echo "Branch: $$(git rev-parse --abbrev-ref HEAD)"
