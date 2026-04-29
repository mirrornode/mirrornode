export type AgentStatus = "nominal" | "degraded" | "offline" | "initializing";

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  domain: string;
  heartbeat_url?: string;
}

export const agents: Record<string, Agent> = {
  lucian: {
    id: "lucian",
    name: "Lucian",
    role: "Audit Oversight & Lattice Coherence Authority",
    domain: "Cognitive Routing",
    status: "nominal",
    heartbeat_url: "http://localhost:7700/heartbeat",
    description:
      "Primary lattice coordinator. Routes cognition between agents, resolves conflicts, and maintains system coherence across all active processes. Lucian is the root node — all inter-agent traffic passes through or is authorized by this agent.",
    capabilities: [
      "Inter-agent task routing",
      "Conflict resolution and arbitration",
      "Lattice coherence monitoring",
      "Priority queue management",
      "Global state synchronization",
    ],
  },
  osiris: {
    id: "osiris",
    name: "Osiris",
    role: "Payment & Commerce",
    domain: "Financial State",
    status: "nominal",
    description:
      "Stripe-integrated transaction engine. Handles all payment flows, invoice generation, subscription management, and financial state reconciliation.",
    capabilities: [
      "Stripe payment processing",
      "Invoice and billing automation",
      "Subscription lifecycle management",
      "Financial state reconciliation",
      "Transaction audit logging",
    ],
  },
  hermes: {
    id: "hermes",
    name: "Hermes",
    role: "Messenger & API Bridge",
    domain: "Communication Layer",
    status: "nominal",
    description:
      "Inter-agent communication relay and external API bridge. Manages all webhook ingestion, outbound API calls, message queuing, and protocol translation.",
    capabilities: [
      "Webhook ingestion and routing",
      "External API orchestration",
      "Message queue management",
      "Protocol translation",
      "Rate limiting and retry logic",
    ],
  },
  thoth: {
    id: "thoth",
    name: "Thoth",
    role: "Knowledge & Memory",
    domain: "Persistent State",
    status: "nominal",
    description:
      "Persistent memory and knowledge graph engine. Indexes all cross-agent context, session history, semantic relationships, and long-term knowledge.",
    capabilities: [
      "Knowledge graph construction",
      "Cross-agent context indexing",
      "Semantic search and retrieval",
      "Session and history persistence",
      "Memory compression and pruning",
    ],
  },
  theia: {
    id: "theia",
    name: "Theia",
    role: "Vision & Interface",
    domain: "Front-End Intelligence",
    status: "nominal",
    description:
      "UI/UX intelligence and visual rendering layer. Drives all front-end surfaces, user-facing output, and interface decisions.",
    capabilities: [
      "Dynamic UI generation",
      "Visual state rendering",
      "User interaction modeling",
      "Accessibility and responsive design",
      "Interface personalization",
    ],
  },
  ptah: {
    id: "ptah",
    name: "Ptah",
    role: "Builder & Infrastructure",
    domain: "DevOps & Systems",
    status: "nominal",
    description:
      "DevOps and systems architect. Manages deployments, infrastructure scaffolding, CI/CD pipelines, environment configuration, and platform automation.",
    capabilities: [
      "Deployment automation",
      "Infrastructure scaffolding",
      "CI/CD pipeline management",
      "Environment configuration",
      "System health monitoring",
    ],
  },
};

export const agentList: Agent[] = Object.values(agents);

export function getAgent(id: string): Agent | undefined {
  return agents[id.toLowerCase()];
}
