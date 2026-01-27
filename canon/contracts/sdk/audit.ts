/**
 * Osiris Audit SDK - Unavoidable Emission (TypeScript)
 * MUST be imported by all Node.js/TypeScript execution contexts.
 */

import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import { readFileSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const CANON_ROOT = process.env.CANON_ROOT || join(process.env.HOME!, 'mirrornode', 'canon');
const DOSSIERS = join(CANON_ROOT, 'dossiers');

type Verdict = 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'ESCALATED';

interface AuditRecord {
  timestamp: string;
  repo: string;
  repo_hash: string;
  charter_hash: string;
  event_type: string;
  actor: string;
  verdict: Verdict;
  evidence: {
    inputs?: any;
    outputs?: any;
    duration_ms: number;
    error: string | null;
  };
  audit_id: string;
}

function getRepoHash(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'UNKNOWN';
  }
}

function getCharterHash(repo: string): string {
  const charterPath = join(
    CANON_ROOT,
    'charters',
    `${repo.toUpperCase().replace(/-/g, '_')}.md`
  );

  try {
    const content = readFileSync(charterPath);
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return 'UNCHARTERED';
  }
}

export function emitAudit(params: {
  repo: string;
  event_type: string;
  actor: string;
  verdict: Verdict;
  evidence: AuditRecord['evidence'];
  charter_override?: string;
}): string {
  const timestamp = new Date().toISOString();
  const audit_id = randomUUID();

  const record: AuditRecord = {
    timestamp,
    repo: params.repo,
    repo_hash: getRepoHash(),
    charter_hash: params.charter_override || getCharterHash(params.repo),
    event_type: params.event_type,
    actor: params.actor,
    verdict: params.verdict,
    evidence: params.evidence,
    audit_id,
  };

  const yearMonth = new Date().toISOString().slice(0, 7);
  const monthDir = join(DOSSIERS, yearMonth);

  try {
    mkdirSync(monthDir, { recursive: true });

    const auditFile = join(
      monthDir,
      `audit-${params.repo}-${timestamp.replace(/:/g, '-')}.json`
    );

    appendFileSync(auditFile, JSON.stringify(record) + '\n');
    console.log(`[AUDIT] ${audit_id} | ${params.repo} | ${params.verdict}`);

    return audit_id;
  } catch (error) {
    throw new Error(
      `AUDIT EMISSION FAILED - EXECUTION HALTED\n` +
        `Audit ID: ${audit_id}\n` +
        `Repo: ${params.repo}\n` +
        `Error: ${error}\n` +
        `This is a constitutional violation.`
    );
  }
}

export function auditExecution(repo: string, actor: string = 'system') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration_ms = Date.now() - startTime;

        emitAudit({
          repo,
          event_type: 'execution',
          actor,
          verdict: 'SUCCESS',
          evidence: { duration_ms, error: null },
        });

        return result;
      } catch (error: any) {
        const duration_ms = Date.now() - startTime;

        emitAudit({
          repo,
          event_type: 'execution',
          actor,
          verdict: 'FAILURE',
          evidence: { duration_ms, error: error.message },
        });

        throw error;
      }
    };

    return descriptor;
  };
}
