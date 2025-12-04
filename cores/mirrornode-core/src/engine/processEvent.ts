import type { MirrorNodeEvent } from "../types/Event";

/**
 * Result type for core processing.
 * This will grow as we add real logic and state handling.
 */
export interface CoreProcessingResult {
  /** Indicates that mirrornode-core handled the event. */
  handled: boolean;
  /** High-level description of what happened. */
  summary: string;
  /** Optional structured data to return to callers. */
  data?: unknown;
}

/**
 * Minimal mirrornode-core processing stub.
 *
 * For now, this:
 * - Accepts a MirrorNodeEvent
 * - Returns a simple CoreProcessingResult with echo information
 *
 * Later, this is where we:
 * - Apply token/state engines
 * - Run routing and rule evaluation
 * - Coordinate with persistent storage layers
 */
export async function processEvent(
  event: MirrorNodeEvent
): Promise<CoreProcessingResult> {
  return {
    handled: true,
    summary: `mirrornode-core received event ${event.meta.id} of type ${event.type}`,
    data: {
      version: event.version,
      type: event.type,
      tags: event.payload.tags ?? [],
      source: event.meta.source ?? null,
      timestamp: event.meta.timestamp
    }
  };
}