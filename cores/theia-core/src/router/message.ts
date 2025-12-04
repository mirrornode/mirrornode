import type { MirrorNodeEvent, TheiaResponse } from "../schemas/Event";
import {
  processEvent,
  type CoreProcessingResult
} from "@mirrornode/mirrornode-core";

/**
 * Theia routing context.
 * This can later hold:
 * - logger instances
 * - connections to mirrornode-core
 * - configuration flags
 */
export interface TheiaContext {
  environment: "development" | "production" | "test";
  /**
   * Optional logger hook. Simple interface to avoid dependency lock-in.
   */
  logger?: {
    debug: (msg: string, extra?: unknown) => void;
    info: (msg: string, extra?: unknown) => void;
    warn: (msg: string, extra?: unknown) => void;
    error: (msg: string, extra?: unknown) => void;
  };
}

/**
 * Basic router entry point for a single event.
 * Currently:
 * - Annotates the event with environment/source info
 * - Forwards it to mirrornode-core's processEvent
 * - Returns the CoreProcessingResult in the response
 */
export async function routeEvent(
  event: MirrorNodeEvent,
  context: TheiaContext
): Promise<TheiaResponse> {
  const { logger, environment } = context;

  logger?.debug("Theia received event", { event });

  const enrichedEvent: MirrorNodeEvent = {
    ...event,
    meta: {
      ...event.meta,
      environment,
      source: event.meta.source
        ? `${event.meta.source}|theia-core`
        : "theia-core"
    }
  };

  let coreResult: CoreProcessingResult;

  try {
    coreResult = await processEvent(enrichedEvent as any);
    logger?.info("Theia routed event to mirrornode-core", {
      id: enrichedEvent.meta.id,
      type: enrichedEvent.type
    });
  } catch (error) {
    logger?.error("Error while processing event in mirrornode-core", { error });

    return {
      ok: false,
      status: "CORE_ERROR",
      message: "Theia failed to process event via mirrornode-core.",
      event: enrichedEvent
    };
  }

  logger?.debug("mirrornode-core result", { coreResult });

  return {
    ok: true,
    status: "ROUTED",
    message: "Event processed by mirrornode-core via theia-core.",
    event: enrichedEvent,
    result: {
      source: "mirrornode-core",
      coreResult
    }
  };
}