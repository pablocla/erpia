"use client"

import React, { useState } from "react"
import { AgentCityProvider, useAgentCity } from "@/lib/agent-city/agent-city-state"
import { TopNavigationBar } from "@/components/agent-city/topbar/TopNavigationBar"
import { CityMapView } from "@/components/agent-city/city-map/CityMapView"
import { AgentNetworkView } from "@/components/agent-city/network/AgentNetworkView"
import { LiveActivityFeed } from "@/components/agent-city/feed/LiveActivityFeed"
import { IncidentRoomView } from "@/components/agent-city/incidents/IncidentRoomView"
import { ApprovalCenterView } from "@/components/agent-city/approvals/ApprovalCenterView"
import { ObservabilityDashboard } from "@/components/agent-city/observability/ObservabilityDashboard"
import { AgentConsoleCli } from "@/components/agent-city/console/AgentConsoleCli"
import { ToolRegistryView } from "@/components/agent-city/tools/ToolRegistryView"
import { AgentMarketplaceView } from "@/components/agent-city/marketplace/AgentMarketplaceView"
import { ScenarioPlaygroundView } from "@/components/agent-city/playground/ScenarioPlaygroundView"
import { AgentDrawer } from "@/components/agent-city/inspector/AgentDrawer"
import { CreateAgentModal } from "@/components/agent-city/modals/CreateAgentModal"

function AgentCityAppContent() {
  const { activeTab } = useAgentCity()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#050506] font-sans text-[#A1A1AA] antialiased select-none">
      <TopNavigationBar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <main className="relative flex-1 overflow-hidden bg-[#050506]">
        {activeTab === "city" && <CityMapView />}
        {activeTab === "network" && <AgentNetworkView />}
        {activeTab === "feed" && <LiveActivityFeed />}
        {activeTab === "incidents" && <IncidentRoomView />}
        {activeTab === "approvals" && <ApprovalCenterView />}
        {activeTab === "observability" && <ObservabilityDashboard />}
        {activeTab === "console" && <AgentConsoleCli />}
        {activeTab === "tools" && <ToolRegistryView />}
        {activeTab === "store" && <AgentMarketplaceView />}
        {activeTab === "playground" && <ScenarioPlaygroundView />}
      </main>

      <footer className="z-30 flex h-9 shrink-0 items-center justify-between border-t border-white/10 bg-[#0A0A0C] px-4 font-mono text-[10px] uppercase tracking-wider sm:px-6">
        <div className="flex items-center gap-4 text-white/40">
          <span className="text-[#3DFF8B]">Lab Claver</span>
          <span className="hidden sm:inline">Chat del agente → Gemini si hay API key</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-amber-400/90 md:inline">
            Mapa, feed y GPU: simulación — no es Protheus en vivo
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3DFF8B]" />
            <span className="text-white/90">Listo para probar</span>
          </span>
        </div>
      </footer>

      <AgentDrawer />
      <CreateAgentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}

export function AgentCityApp() {
  return (
    <AgentCityProvider>
      <AgentCityAppContent />
    </AgentCityProvider>
  )
}
