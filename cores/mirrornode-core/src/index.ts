// cores/mirrornode-core/src/index.ts

export type { CoreProcessingResult } from "./engine/processEvent";
export { processEvent } from "./engine/processEvent";

export { BridgeClient } from "./bridge/BridgeClient";
export type {
  BridgeEvent,
  BridgeResponse,
  BridgeHealthResponse,
} from "./bridge/BridgeClient";
