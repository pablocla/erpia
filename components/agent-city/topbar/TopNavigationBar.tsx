'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { 
  Building2, 
  Network, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  BarChart3, 
  Terminal, 
  Wrench, 
  Store, 
  FlaskConical, 
  Plus, 
  Play, 
  Pause, 
  FastForward, 
  Sparkles,
  ChevronDown,
  Database,
  Cpu,
  Layers
} from 'lucide-react';

interface TopNavigationBarProps {
  onOpenCreateModal: () => void;
}

export function TopNavigationBar({ onOpenCreateModal }: TopNavigationBarProps) {
  const { 
    currentTenant, 
    tenants, 
    setCurrentTenant,
    metrics, 
    activeTab, 
    setActiveTab, 
    simulationSpeed, 
    setSimulationSpeed,
    triggerCustomScenario,
    incidents,
    approvals
  } = useAgentCity();

  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);

  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;
  const activeIncidentsCount = incidents.filter(i => i.status === 'INVESTIGATING').length;

  const navItems = [
    { id: 'city', label: 'City Map', icon: Building2, count: null },
    { id: 'network', label: 'Network', icon: Network, count: null },
    { id: 'feed', label: 'Live Bus', icon: Activity, count: null },
    { id: 'incidents', label: 'Incident Room', icon: AlertTriangle, count: activeIncidentsCount, alert: activeIncidentsCount > 0 },
    { id: 'approvals', label: 'Approvals', icon: ShieldAlert, count: pendingApprovalsCount, badge: pendingApprovalsCount > 0 },
    { id: 'observability', label: 'Observability', icon: BarChart3, count: null },
    { id: 'console', label: 'Console', icon: Terminal, count: null },
    { id: 'tools', label: 'Tool Registry', icon: Wrench, count: null },
    { id: 'store', label: 'Agent Store', icon: Store, count: null },
    { id: 'playground', label: 'Playground', icon: FlaskConical, count: null },
  ];

  return (
    <header className="bg-[#0A0A0C] border-b border-white/10 sticky top-0 z-40 text-[#A1A1AA]">
      {/* Top Banner: Brand, Metrics & Tenant Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/claver/agent-city"
              className="relative flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-[#3DFF8B] to-[#1E40AF] shadow-md shadow-emerald-500/10"
              title="Volver a Claver"
            >
              <span className="text-black font-bold text-xs tracking-tight">AC</span>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DFF8B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3DFF8B] ring-2 ring-[#0A0A0C]"></span>
              </span>
            </Link>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-serif italic text-white tracking-tight">
                  Agent City <span className="text-xs font-sans not-italic text-white/40 ml-1.5 hidden xs:inline">Lab Claver</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#3DFF8B]/10 text-[#3DFF8B] border border-[#3DFF8B]/30 uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DFF8B] animate-pulse"></span>
                  24/7 Autonomous
                </span>
              </div>
              <p className="text-[10px] text-white/40 font-mono hidden md:block">
                <Link href="/" className="hover:text-[#3DFF8B]">claver.com.ar</Link>
                {" · "}lab de agentes ERP · chat Gemini · mapa simulado
              </p>
            </div>
          </div>

          {/* Quick Real-Time Metrics Ticker */}
          <div className="hidden xl:flex items-center space-x-5 text-[10px] uppercase tracking-widest font-mono">
            <div className="flex flex-col items-end">
              <span className="text-white/40">Total Ops</span>
              <span className="text-[#3DFF8B] font-bold">142,891</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/40">Active Agents</span>
              <span className="text-white font-bold">{metrics.activeAgents} / {metrics.totalAgents}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/40">Success Rate</span>
              <span className="text-[#3DFF8B] font-bold">{metrics.successRate}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/40">Daily Cost</span>
              <span className="text-white font-bold">${metrics.totalAiCost}</span>
            </div>
          </div>

          {/* Controls & Tenant Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Simulation Speed Controls */}
            <div className="flex items-center bg-[#111114] border border-white/10 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setSimulationSpeed(0)}
                title="Pause Live Simulation"
                className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
                  simulationSpeed === 0 ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-white/40 hover:text-white'
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSimulationSpeed(1)}
                title="1x Real-time Live Events"
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                  simulationSpeed === 1 ? 'bg-[#3DFF8B]/10 text-[#3DFF8B] font-semibold border border-[#3DFF8B]/30' : 'text-white/40 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1x</span>
              </button>
              <button
                onClick={() => setSimulationSpeed(3)}
                title="3x Fast Simulation"
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                  simulationSpeed === 3 ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-white/40 hover:text-white'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3x</span>
              </button>
            </div>

            {/* Quick Scenario Trigger Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsScenarioDropdownOpen(!isScenarioDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111114] hover:bg-[#1a1a1f] border border-white/10 rounded-lg text-xs font-medium text-white/80 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3DFF8B]" />
                <span className="hidden md:inline">Simulate Event</span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>

              {isScenarioDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-64 bg-[#0A0A0C] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 text-xs font-sans"
                  onMouseLeave={() => setIsScenarioDropdownOpen(false)}
                >
                  <div className="px-2 py-1.5 text-[10px] font-mono text-white/40 uppercase tracking-wider border-b border-white/10">
                    Inject Simulated Event
                  </div>
                  <button
                    onClick={() => { triggerCustomScenario('invoice_error'); setIsScenarioDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-2 hover:bg-white/5 rounded-lg text-white/90 flex flex-col gap-0.5 transition-colors"
                  >
                    <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                      ⚠️ ARCA Invoice D2_TES Error
                    </span>
                    <span className="text-[11px] text-white/40">Trigger invoice rejection & Functional Agent investigation</span>
                  </button>
                  <button
                    onClick={() => { triggerCustomScenario('bank_sync'); setIsScenarioDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-2 hover:bg-white/5 rounded-lg text-white/90 flex flex-col gap-0.5 transition-colors"
                  >
                    <span className="font-semibold text-[#3DFF8B] flex items-center gap-1.5">
                      💳 OFX Bank Statement Batch
                    </span>
                    <span className="text-[11px] text-white/40">Reconcile 86 wire receipts with SE1 ledger ($0 tokens)</span>
                  </button>
                  <button
                    onClick={() => { triggerCustomScenario('credit_approval'); setIsScenarioDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-2 hover:bg-white/5 rounded-lg text-white/90 flex flex-col gap-0.5 transition-colors"
                  >
                    <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                      🛡️ High-Value Credit Approval
                    </span>
                    <span className="text-[11px] text-white/40">Route $850k credit line to Human Approval Center</span>
                  </button>
                  <button
                    onClick={() => { triggerCustomScenario('high_volume'); setIsScenarioDropdownOpen(false); }}
                    className="w-full text-left px-2.5 py-2 hover:bg-white/5 rounded-lg text-white/90 flex flex-col gap-0.5 transition-colors"
                  >
                    <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                      ⚡ High-Volume Batch Burst
                    </span>
                    <span className="text-[11px] text-white/40">Simulate 5 rapid multi-agent ERP operations</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tenant Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[#111114] hover:bg-[#1a1a1f] border border-white/10 rounded-lg text-xs text-white/90 font-medium transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-[#3DFF8B]" />
                <span className="truncate max-w-[110px] sm:max-w-[140px]">{currentTenant.name}</span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>

              {isTenantDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-60 bg-[#0A0A0C] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 text-xs font-sans"
                  onMouseLeave={() => setIsTenantDropdownOpen(false)}
                >
                  <div className="px-2 py-1.5 text-[10px] font-mono text-white/40 uppercase tracking-wider border-b border-white/10">
                    Switch Enterprise Tenant
                  </div>
                  {tenants.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setCurrentTenant(t); setIsTenantDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        currentTenant.id === t.id ? 'bg-[#3DFF8B]/10 text-[#3DFF8B] font-semibold border border-[#3DFF8B]/30' : 'hover:bg-white/5 text-white/70'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-white">{t.name}</span>
                        <span className="text-[10px] text-white/40">{t.connectedErp}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 font-mono">
                        {t.plan}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Create Agent Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3DFF8B] hover:bg-[#32e078] text-black font-bold rounded-lg text-xs shadow-md shadow-[#3DFF8B]/10 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deploy Agent</span>
            </button>

          </div>
        </div>

        {/* Bottom Tab Navigation Bar */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1 border-t border-white/5 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#3DFF8B]/10 text-[#3DFF8B] border border-[#3DFF8B]/30 shadow-sm shadow-[#3DFF8B]/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#3DFF8B]' : 'text-white/40'}`} />
                <span>{item.label}</span>
                {item.count !== null && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    item.alert ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400 text-black'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
