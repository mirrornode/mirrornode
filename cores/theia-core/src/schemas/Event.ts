/**
 * Core event and envelope types for Theia-core.
 *
 * These are intentionally minimal and stable so that:
 * - Agents (Lucian, Merlin, etc.) can construct events
 * - Starter-kits can send events through Theia to mirrornode-core
 */

export type EventType =
  | "INTEGRATION"
  | "EXECUTION"
  | "ANALYSIS"
  | "REFLECTION"
  | "MANIFESTATION";

export interface MirrorNodeEventMeta {
  /** Unique ID for this event (UUID or similar). */
  id: string;
  /** Optional parent event ID for traceability. */
  parentId?: string;
  /** ISO timestamp when the event was created. */
  timestamp: string;
  /** Optional human-readable source label (e.g., "lucian", "dashboard-kit"). */
  source?: string;
  /** Optional environment hint (e.g., "dev", "prod"). */
  environment?: string;
}

export interface MirrorNodeEventPayload {
  /** Arbitrary payload from agents or starter-kits. */
  data: unknown;
  /** Optional tags or flags for routing. */
  tags?: string[];
}

/**
 * Canonical event envelope for MIRRORNODE traffic.
 */
export interface MirrorNodeEvent {
  /** Semantic version of the envelope format (e.g., "1.0.0"). */
  version: string;
  /** High-level event type. */
  type: EventType;
  /** Metadata for traceability and routing. */
  meta: MirrorNodeEventMeta;
  /** Payload container. */
  payload: MirrorNodeEventPayload;
}

/**
 * Minimal response envelope from Theia-core.
 * Future versions may include richer routing diagnostics.
 */
export interface TheiaResponse {
  /** Whether the request was handled successfully. */
  ok: boolean;
  /** Optional machine-readable reason or status. */
  status?: string;
  /** Optional human-readable message. */
  message?: string;
  /** The original event, possibly enriched. */
  event?: MirrorNodeEvent;
  /** Arbitrary result data from mirrornode-core or downstream handlers. */
  result?: unknown;
}