import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Outcome, ReasonCode } from "./tools.js";

/** Deterministic JSON (sorted keys) so hashes are reproducible. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export interface Receipt {
  receipt_id: string;
  sequence: number;
  tool: string;
  node: "THEIA" | "PTAH" | "THOTH" | "LATTICE";
  invoked_at: string;
  outcome: Outcome;
  reason_codes: ReasonCode[];
  subject_sha256: string; // HMAC-SHA256 pseudonym of iss:sub
  client_id: string;
  scopes_granted: string[];
  scope_required: string;
  input_sha256: string;
  output_sha256: string;
  fixture_set: string;
  fixture_sha256: string;
  data_classification: "SYNTHETIC";
  prev_receipt_sha256: string | null;
  receipt_sha256: string;
}

export type ReceiptDraft = Omit<Receipt, "receipt_id" | "sequence" | "invoked_at" | "prev_receipt_sha256" | "receipt_sha256">;

/**
 * Append-only, hash-chained receipt ledger. Stores hashes of inputs/outputs
 * and of the token subject, never raw prompts, tokens or subject identifiers.
 */
export class ReceiptLedger {
  private receipts: Receipt[] = [];
  constructor(private readonly jsonlPath?: string, private readonly now: () => Date = () => new Date()) {
    if (jsonlPath) mkdirSync(dirname(jsonlPath), { recursive: true });
  }

  append(draft: ReceiptDraft): Receipt {
    const prev = this.receipts.at(-1) ?? null;
    const body = {
      ...draft,
      receipt_id: `rcpt_${randomUUID()}`,
      sequence: this.receipts.length + 1,
      invoked_at: this.now().toISOString(),
      prev_receipt_sha256: prev ? prev.receipt_sha256 : null,
    };
    const receipt: Receipt = { ...body, receipt_sha256: sha256(canonicalJson(body)) };
    this.receipts.push(receipt);
    if (this.jsonlPath) appendFileSync(this.jsonlPath, canonicalJson(receipt) + "\n");
    return receipt;
  }

  get(id: string): Receipt | undefined { return this.receipts.find((r) => r.receipt_id === id); }
  all(): readonly Receipt[] { return this.receipts; }

  /** Recomputes every hash and link. Returns the first broken sequence number, if any. */
  verify(list: readonly Receipt[] = this.receipts): { consistent: boolean; checked: number; first_mismatch_sequence: number | null } {
    let prevHash: string | null = null;
    for (const r of list) {
      const { receipt_sha256, ...body } = r;
      if (r.prev_receipt_sha256 !== prevHash || sha256(canonicalJson(body)) !== receipt_sha256) {
        return { consistent: false, checked: list.length, first_mismatch_sequence: r.sequence };
      }
      prevHash = receipt_sha256;
    }
    return { consistent: true, checked: list.length, first_mismatch_sequence: null };
  }
}
