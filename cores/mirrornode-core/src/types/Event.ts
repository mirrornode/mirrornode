/**
 * Canonical event types and envelopes for MIRRORNODE.
 *
 * These types intentionally match the structures used by theia-core.
 * Over time, theia-core should import these directly rather than duplicating them.
 */

export type EventType =
  | "INTEGRATION"
  | "EXECUTION"
  | "ANALYSIS"
  | "REFLECTION"
  | "MANIFESTATION";

export interface MirrorNodeEventMeta {
  id: string;
  parentId?: string;
  timestamp: string;
  source?: string;
  environment?: string;
}

export interface MirrorNodeEventPayload {
  data: unknown;
  tags?: string[];
}

export interface MirrorNodeEvent {
  version: string;
  type: EventType;
  meta: MirrorNodeEventMeta;
  payload: MirrorNodeEventPayload;
}