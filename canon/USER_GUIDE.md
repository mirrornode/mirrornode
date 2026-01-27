# MIRRORNODE Canon - User Guide

**For:** Developers integrating canon governance  
**Level:** Intermediate (assumes git/terminal familiarity)

---

## Installation

### 1. Clone the repo
```bash
git clone https://github.com/mirrornode/mirrornode.git
cd mirrornode
```

### 2. Bootstrap canon
```bash
./canon/scripts/bootstrap.sh
```

### 3. Verify installation
```bash
make audit-test
```

**Expected output:**
```
[AUDIT] {uuid} | osiris-audit | SUCCESS
✓ Self-test passed: {uuid}
```

---

## Daily Workflow

### Morning Ritual
```bash
cd ~/mirrornode
make audit-check
```

---

## Integrating Audit SDK

### Python Project
```python
from audit import audit_execution

@audit_execution("your-repo", actor="agent")
def process_data(data):
    # Your code here
    return {"status": "success"}
```

### TypeScript Project
```typescript
import { auditExecution } from './audit';

class DataService {
  @auditExecution('your-repo', 'agent')
  async processData(data: any) {
    return { status: 'success' };
  }
}
```

---

## Creating a Charter
```bash
cat > canon/charters/YOUR_REPO.md <<'EOCHARTER'
# YOUR_REPO — Canon Charter

## Designation
Brief role description

## Purpose
What this repo exists to do

## Mandate
- Responsibility 1
- Responsibility 2

## Prohibitions
- NO forbidden action 1
- NO forbidden action 2

## Authority Boundaries
MAY: Allowed operations
MAY NOT: Forbidden operations

Status: LOCKED
Signed: Your Name
Date: $(date +%Y-%m-%d)
EOCHARTER
```

---

## Reading Audit Records

### View today's audits
```bash
cat canon/dossiers/$(date +%Y-%m)/audit-*.json | jq
```

### Find failures
```bash
grep '"verdict": "FAILURE"' canon/dossiers/$(date +%Y-%m)/audit-*.json | jq
```

---

## Getting Help

1. Check the INDEX: `canon/INDEX.md`
2. Run diagnostics: `make audit-check`
3. File an issue: https://github.com/mirrornode/mirrornode/issues

