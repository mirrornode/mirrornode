.PHONY: all
all: help

.PHONY: help
help:
	@echo "════════════════════════════════════════"
	@echo " MIRRORNODE Canon - Command Reference"
	@echo "════════════════════════════════════════"
	@echo ""
	@echo "📋 Documentation:"
	@echo "  help              Show this message"
	@echo "  docs              Open documentation"
	@echo "  verify            Check system integrity"
	@echo ""
	@echo "🔍 Audit Operations:"
	@echo "  audit-check       Check compliance (warnings)"
	@echo "  audit-strict      Check compliance (strict)"
	@echo "  audit-test        Test audit SDK"
	@echo "  audit-month       Show audits this month"
	@echo ""
	@echo "📜 Charter Operations:"
	@echo "  charters          List active charters"
	@echo "  charter-hashes    Show verification hashes"
	@echo ""
	@echo "🔧 System Operations:"
	@echo "  bootstrap         Initialize canon"
	@echo "  status            Show system status"
	@echo ""

.PHONY: docs
docs:
	@cat canon/INDEX.md

.PHONY: verify
verify:
	@./canon/scripts/verify_integrity.sh

.PHONY: audit-check
audit-check:
	@./canon/scripts/enforce_audits.sh

.PHONY: audit-strict
audit-strict:
	@./canon/scripts/enforce_audits.sh --strict

.PHONY: audit-test
audit-test:
	@python3 canon/contracts/sdk/audit.py

.PHONY: audit-month
audit-month:
	@find canon/dossiers/$$(date +%Y-%m) -name "audit-*.json" -exec cat {} \; 2>/dev/null | jq -s '.'

.PHONY: charters
charters:
	@echo "Active Charters:"
	@ls -1 canon/charters/*.md 2>/dev/null | grep -v "\.sig" | sed 's/canon\/charters\//  ✓ /' | sed 's/\.md//'

.PHONY: charter-hashes
charter-hashes:
	@find canon/charters -name "*.md" -not -name "*.sig" | while read f; do \
		printf "  %s: %s\n" "$$(basename $$f .md)" "$$(shasum -a 256 $$f | cut -d' ' -f1)"; \
	done

.PHONY: bootstrap
bootstrap:
	@./canon/scripts/bootstrap.sh

.PHONY: status
status:
	@echo "MIRRORNODE Canon Status"
	@echo "══════════════════════════════════════"
	@echo "Git commit: $$(git rev-parse --short HEAD)"
	@echo "Charters:   $$(find canon/charters -name '*.md' -not -name '*.sig' | wc -l | tr -d ' ')"
	@echo "Audits:     $$(find canon/dossiers -name 'audit-*.json' 2>/dev/null | wc -l | tr -d ' ')"
	@echo "Last check: $$(date)"
