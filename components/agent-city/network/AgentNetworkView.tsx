'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { Agent, DepartmentId } from '@/types/agent-city';
import { 
  Network, 
  Share2, 
  Activity, 
  ArrowRight, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Filter,
  Sparkles
} from 'lucide-react';

interface NetworkNode {
  id: string;
  agentId: string;
  label: string;
  role: string;
  avatar: string;
  department: DepartmentId;
  x: number;
  y: number;
  color: string;
  activePulse?: boolean;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: 'DELEGATION' | 'ESCALATION' | 'SYNC' | 'INSPECTION';
  color: string;
  isPulsing?: boolean;
}

export function AgentNetworkView() {
  const { agents, selectAgent, events } = useAgentCity();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('agent-billing-01');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'ESCALATIONS'>('ALL');

  // Network topology coordinates
  const nodes: NetworkNode[] = [
    { id: 'agent-customer-01', agentId: 'agent-customer-01', label: 'Customer Care', role: 'Inbound Dispatcher', avatar: '💬', department: 'CUSTOMER_SERVICE', x: 180, y: 100, color: '#8b5cf6', activePulse: true },
    { id: 'agent-sales-01', agentId: 'agent-sales-01', label: 'Sales Quotation', role: 'Quote & Margin Engine', avatar: '📈', department: 'SALES', x: 420, y: 100, color: '#f59e0b', activePulse: true },
    { id: 'agent-operations-01', agentId: 'agent-operations-01', label: 'Logistics Dispatch', role: 'Warehouse Pick & Pack', avatar: '📦', department: 'OPERATIONS', x: 680, y: 100, color: '#ec4899' },
    { id: 'agent-billing-01', agentId: 'agent-billing-01', label: 'Billing Alpha', role: 'Invoice & ARCA Transmitter', avatar: '🤖', department: 'BILLING', x: 300, y: 260, color: '#06b6d4', activePulse: true },
    { id: 'agent-finance-01', agentId: 'agent-finance-01', label: 'Credit Evaluator', role: 'High-Risk Guard & Risk Gate', avatar: '⚖️', department: 'FINANCE', x: 560, y: 260, color: '#14b8a6' },
    { id: 'agent-accounting-01', agentId: 'agent-accounting-01', label: 'Accounting Conciliator', role: 'Bank Ledger Matcher', avatar: '📊', department: 'ACCOUNTING', x: 420, y: 410, color: '#10b981', activePulse: true },
    { id: 'agent-functional-01', agentId: 'agent-functional-01', label: 'Functional ERP Support', role: 'Schema & Root Cause Specialist', avatar: '🔬', department: 'FUNCTIONAL_SUPPORT', x: 140, y: 410, color: '#3b82f6', activePulse: true },
    { id: 'agent-infra-01', agentId: 'agent-infra-01', label: 'Infra Sentinel', role: 'AppServer & DB Watchdog', avatar: '🛡️', department: 'INFRASTRUCTURE', x: 700, y: 410, color: '#ef4444' },
  ];

  const edges: NetworkEdge[] = [
    { id: 'e1', from: 'agent-customer-01', to: 'agent-sales-01', label: 'Customer Order Intake', type: 'DELEGATION', color: '#8b5cf6', isPulsing: true },
    { id: 'e2', from: 'agent-sales-01', to: 'agent-billing-01', label: 'Authorized Sales Order SO-4421', type: 'DELEGATION', color: '#f59e0b', isPulsing: true },
    { id: 'e3', from: 'agent-sales-01', to: 'agent-operations-01', label: 'Reserve Inventory SC9', type: 'SYNC', color: '#ec4899' },
    { id: 'e4', from: 'agent-billing-01', to: 'agent-finance-01', label: 'Credit Limit / Exception Check', type: 'SYNC', color: '#06b6d4' },
    { id: 'e5', from: 'agent-billing-01', to: 'agent-accounting-01', label: 'Post Accounts Receivable (SE1)', type: 'DELEGATION', color: '#10b981', isPulsing: true },
    { id: 'e6', from: 'agent-billing-01', to: 'agent-functional-01', label: 'D2_TES Null Schema Escalation', type: 'ESCALATION', color: '#3b82f6', isPulsing: true },
    { id: 'e7', from: 'agent-functional-01', to: 'agent-infra-01', label: 'Query AppServer Connection Logs', type: 'INSPECTION', color: '#ef4444' },
    { id: 'e8', from: 'agent-finance-01', to: 'agent-accounting-01', label: 'Daily Bank Settlement Feed', type: 'SYNC', color: '#14b8a6' },
  ];

  const selectedAgent = agents.find(a => a.id === selectedNodeId) || agents[0];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              AGENT COLLABORATION TOPOLOGY & EVENT ROUTING
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                8 Active Hubs
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live inter-agent message buses, task delegations, and automated escalation pipelines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono hidden sm:inline">Event Streams:</span>
          <button 
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${activeFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
          >
            All Channels
          </button>
          <button 
            onClick={() => setActiveFilter('ACTIVE')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${activeFilter === 'ACTIVE' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
          >
            Active Ingestion
          </button>
          <button 
            onClick={() => setActiveFilter('ESCALATIONS')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${activeFilter === 'ESCALATIONS' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
          >
            Escalations & Alerts
          </button>
        </div>
      </div>

      {/* Main Canvas & Side Inspector Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-0 overflow-hidden">
        
        {/* SVG Interactive Topology Canvas */}
        <div className="lg:col-span-2 xl:col-span-3 bg-slate-950 p-6 relative flex items-center justify-center overflow-auto">
          {/* Subtle Grid Matrix Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

          <div className="w-[840px] h-[520px] relative bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4 shadow-2xl backdrop-blur-sm">
            
            {/* SVG Connecting Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {edges.map((edge) => {
                const source = nodes.find(n => n.id === edge.from);
                const target = nodes.find(n => n.id === edge.to);
                if (!source || !target) return null;

                const isSelected = selectedNodeId === source.id || selectedNodeId === target.id;

                return (
                  <g key={edge.id}>
                    {/* Background line */}
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isSelected ? edge.color : '#334155'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      strokeDasharray={edge.type === 'ESCALATION' ? '4 4' : 'none'}
                      opacity={isSelected ? 0.9 : 0.4}
                    />

                    {/* Animated Pulse Particle */}
                    {edge.isPulsing && (
                      <circle r="3.5" fill={edge.color} filter="url(#glow)">
                        <animateMotion
                          path={`M ${source.x} ${source.y} L ${target.x} ${target.y}`}
                          dur={edge.type === 'ESCALATION' ? '1.8s' : '3.2s'}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    selectAgent(node.agentId);
                  }}
                  style={{
                    left: `${node.x - 70}px`,
                    top: `${node.y - 35}px`,
                  }}
                  className={`absolute w-36 p-2 rounded-xl bg-slate-900/95 border transition-all duration-200 cursor-pointer shadow-xl flex flex-col items-center text-center group ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-500/30 scale-105 shadow-cyan-500/20'
                      : 'border-slate-800 hover:border-slate-700 hover:scale-102'
                  }`}
                >
                  <div className="relative mb-1">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base border shadow-inner"
                      style={{ backgroundColor: `${node.color}20`, borderColor: `${node.color}50` }}
                    >
                      <span>{node.avatar}</span>
                    </div>
                    {node.activePulse && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-slate-100 truncate w-full group-hover:text-cyan-300">
                    {node.label}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate w-full font-mono">
                    {node.role}
                  </span>
                </div>
              );
            })}

          </div>
        </div>

        {/* Node Detail & Real-Time Stream Inspector */}
        <div className="bg-slate-900/70 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
          {selectedAgent ? (
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
                  {selectedAgent.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{selectedAgent.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedAgent.role}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {selectedAgent.primaryModel}
                  </span>
                </div>
              </div>

              {/* Status & Current Execution */}
              <div className="space-y-3 mb-5">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-mono">NODE STATUS</span>
                    <span className="text-emerald-400 font-bold font-mono">{selectedAgent.status}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {selectedAgent.statusMessage || 'Idle in queue. Listening to event bus.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TASKS PROCESSED</span>
                    <span className="text-white font-bold">{selectedAgent.tasksToday.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">AVG LATENCY</span>
                    <span className="text-cyan-300 font-bold">142ms</span>
                  </div>
                </div>
              </div>

              {/* Connected Peer Channels */}
              <div className="mb-5">
                <span className="text-[11px] font-semibold text-slate-400 font-mono uppercase tracking-wider block mb-2">
                  Connected Peer Channels
                </span>
                <div className="space-y-1.5 text-xs">
                  {edges.filter(e => e.from === selectedAgent.id || e.to === selectedAgent.id).map(e => (
                    <div key={e.id} className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
                      <span className="text-slate-300 truncate max-w-[170px]">{e.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {e.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspect Agent Button */}
              <button
                onClick={() => selectAgent(selectedAgent.id)}
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Open Agent Command Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              Select any node in the topology graph to inspect its live communication pipes.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
