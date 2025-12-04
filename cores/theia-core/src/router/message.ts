import type { MirrorNodeEvent, TheiaResponse } from "../schemas/Event";

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
 * For now, it simply echoes the event back and annotates that Theia handled it.
 * Later, this is where we will:
 * - Call mirrornode-core
 * - Branch by event.type and tags
 * - Proxy to external LLMs
 */
export async function routeEvent(
  event: MirrorNodeEvent,
  context: TheiaContext
): Promise<TheiaResponse> {
  const { logger, environment } = context;

  logger?.debug("Theia received event", { event });

  // TODO: Replace this with real routing into mirrornode-core.
  const enrichedEvent: MirrorNodeEvent = {
    ...event,
    meta: {
      ...event.meta,
      environment,
      // preserve existing source, but annotate that Theia touched it
      source: event.meta.source
        ? `${event.meta.source}|theia-core`
        : "theia-core"
    }
  };

  logger?.info("Theia handled event", {
    id: enrichedEvent.meta.id,
    type: enrichedEvent.type
  });

  return {
    ok: true,
    status: "ROUTED",
    message: "Event routed by theia-core (stub implementation).",
    event: enrichedEvent,
    result: {
      echo: true
    }
  };
}