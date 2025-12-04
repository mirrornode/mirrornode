/**
 * Public entrypoint for theia-core.
 *
 * This file exposes:
 * - Types: MirrorNodeEvent, TheiaResponse, TheiaContext
 * - Factory: createTheiaGateway
 * - Low-level router: routeEvent
 *
 * A Next.js API route or any other HTTP handler can:
 *  1. Parse incoming HTTP into a MirrorNodeEvent
 *  2. Call gateway.handleEvent(event)
 *  3. Serialize the TheiaResponse back to HTTP
 */

import {
  MirrorNodeEvent,
  TheiaResponse
} from "./schemas/Event";
import {
  TheiaContext,
  routeEvent
} from "./router/message";

export type {
  MirrorNodeEvent,
  TheiaResponse,
  TheiaContext
};

/**
 * Shape of the gateway object consumers will interact with.
 */
export interface TheiaGateway {
  handleEvent: (event: MirrorNodeEvent) => Promise<TheiaResponse>;
}

/**
 * Configuration for creating a Theia gateway.
 */
export interface TheiaConfig {
  environment?: "development" | "production" | "test";
  logger?: TheiaContext["logger"];
}

/**
 * Factory to create a configured Theia gateway.
 *
 * Example (Next.js API route pseudo-code):
 *
 *   import { createTheiaGateway } from "@mirrornode/theia-core";
 *
 *   const gateway = createTheiaGateway({ environment: "development" });
 *
 *   export default async function handler(req, res) {
 *     const event = req.body as MirrorNodeEvent;
 *     const response = await gateway.handleEvent(event);
 *     res.status(response.ok ? 200 : 400).json(response);
 *   }
 */
export function createTheiaGateway(config: TheiaConfig = {}): TheiaGateway {
  const context: TheiaContext = {
    environment: config.environment ?? "development",
    logger: config.logger
  };

  return {
    async handleEvent(event: MirrorNodeEvent): Promise<TheiaResponse> {
      return routeEvent(event, context);
    }
  };
}