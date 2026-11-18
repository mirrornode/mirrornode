import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod/v4";

/** Evidence classes used across MIRRORNODE handoffs. */
export const EvidenceClass = z.enum(["OBSERVED", "REPORTED", "INFERRED", "BLOCKED", "UNKNOWN"]);

const Gate = z.object({
  id: z.string(), description: z.string(), owner_role: z.string(),
  state: z.enum(["OPEN", "CLOSED"]), evidence_class: EvidenceClass, evidence_ref: z.string().nullable(),
});
const FixtureFile = z.object({
  data_classification: z.literal("SYNTHETIC"),
  fixture_set: z.string(),
  notice: z.string(),
  workstreams: z.array(z.object({
    id: z.string(), title: z.string(), phase: z.string(), status: z.string(), summary: z.string(), gates: z.array(Gate),
  })),
  actions: z.array(z.object({
    id: z.string(), workstream_id: z.string(), description: z.string(), required_authority: z.string(),
    blocked_by: z.array(z.string()), reversible: z.boolean(),
  })),
  components: z.array(z.object({
    id: z.string(), title: z.string(), readiness: z.string(),
    evidence: z.array(z.object({ claim: z.string(), evidence_class: EvidenceClass, ref: z.string() })),
    open_findings: z.array(z.string()),
  })),
  findings: z.array(z.object({
    id: z.string(), severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]), component_id: z.string(),
    title: z.string(), evidence_class: EvidenceClass,
    disposition: z.object({
      status: z.string(), recorded_by: z.string(), recorded_at: z.string(), clearance_requirements: z.array(z.string()),
    }).nullable(),
  })),
  repairs: z.array(z.object({
    finding_id: z.string(), summary: z.string(), files_in_scope: z.array(z.string()),
    tests_required: z.array(z.string()), rollback: z.string(),
  })),
  records: z.array(z.object({
    id: z.string(), title: z.string(), value: z.string(), evidence_class: EvidenceClass, source_ref: z.string(),
    recorded_at: z.string(), recorded_by: z.string(),
  })),
  contradictions: z.array(z.object({
    id: z.string(), record_ids: z.array(z.string()), description: z.string(), status: z.string(), resolution_owner: z.string(),
  })),
});
export type Fixtures = z.infer<typeof FixtureFile>;

export interface LoadedFixtures { data: Fixtures; sha256: string; path: string }

/** Finds fixtures/ relative to the package root whether running from src/ or dist/src/. */
function findFixture(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 4; i++) {
    const candidate = resolve(dir, "fixtures/synthetic-v0.1.json");
    if (existsSync(candidate)) return candidate;
    dir = resolve(dir, "..");
  }
  throw new Error("Synthetic fixture file not found");
}
export const DEFAULT_FIXTURE_PATH = findFixture();

/**
 * Loads the fixture set. Refuses anything not marked SYNTHETIC so this slice
 * cannot be pointed at real records by configuration alone.
 */
export function loadFixtures(path: string = DEFAULT_FIXTURE_PATH): LoadedFixtures {
  const raw = readFileSync(path);
  const parsed = FixtureFile.safeParse(JSON.parse(raw.toString("utf8")));
  if (!parsed.success) {
    throw new Error(`Fixture file rejected (must be data_classification=SYNTHETIC and match schema): ${parsed.error.message}`);
  }
  return { data: parsed.data, sha256: createHash("sha256").update(raw).digest("hex"), path };
}
