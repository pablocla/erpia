/**
 * Agent Bootstrap — Registers all agents and wires event bus
 *
 * Import this file at app startup to activate the agent system.
 */

import { agentRegistry } from "./agent-registry"
import { StockAlertsAgent } from "./stock-alerts-agent"
import { CobranzasAgent } from "./cobranzas-agent"
import { VentasLeadsAgent } from "./ventas-leads-agent"
import { ComprasPredictiveAgent } from "./compras-predictivo-agent"
import { AnomaliasAgent } from "./anomalias-agent"
import { ReportesAgent } from "./reportes-agent"
import { CommunityManagerAgent } from "./community-manager-agent"
import { MarketingAgent } from "./marketing-agent"
import { ClasificadorProductosAgent } from "./clasificador-productos-agent"
import { OnboardingAgent } from "./onboarding-agent"
import { eventBus } from "@/lib/events/event-bus"
import type { ERPEvent } from "@/lib/events/types"

// ─── Register all agents ──────────────────────────────────────────────────────

agentRegistry.register(new StockAlertsAgent())
agentRegistry.register(new CobranzasAgent())
agentRegistry.register(new VentasLeadsAgent())
agentRegistry.register(new ComprasPredictiveAgent())
agentRegistry.register(new AnomaliasAgent())
agentRegistry.register(new ReportesAgent())
agentRegistry.register(new CommunityManagerAgent())
agentRegistry.register(new MarketingAgent())
agentRegistry.register(new ClasificadorProductosAgent())
agentRegistry.register(new OnboardingAgent())

// ─── Wire event bus to agents ─────────────────────────────────────────────────
// Each event triggers relevant agents reactively

const EVENT_AGENT_MAP: Record<string, boolean> = {}

function wireEventToAgents(event: ERPEvent<any>) {
  if (!event.empresaId) return
  // Fire-and-forget: don't block event pipeline
  agentRegistry.handleEvent(event.type, event.empresaId, event.payload).catch((err) => {
    console.error(`[AgentBus] Error handling ${event.type}:`, err)
  })
}

// Register on event bus for every event type that at least one agent reacts to
const allReactiveEvents = new Set<string>()
for (const agent of agentRegistry.getAll()) {
  for (const eventType of agent.config.reactsTo) {
    allReactiveEvents.add(eventType)
  }
}

for (const eventType of allReactiveEvents) {
  eventBus.on(eventType as any, `agent_bus_${eventType}`, wireEventToAgents)
}

console.log(
  `[AgentSystem] ${agentRegistry.getAll().length} agentes registrados, ${allReactiveEvents.size} eventos conectados`
)

export { agentRegistry }
