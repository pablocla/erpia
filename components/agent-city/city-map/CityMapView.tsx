'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { Department, Agent, AgentStatus, DepartmentId } from '@/types/agent-city';
import { OfficeFloorView } from '@/components/agent-city/city-map/OfficeFloorView';
import { 
  Building2, 
  Cpu, 
  ReceiptText, 
  Scale, 
  MessageSquare, 
  TrendingUp, 
  Server, 
  Package, 
  ShieldCheck, 
  Zap, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

export function CityMapView() {
  const { 
    departments, 
    agents, 
    selectAgent, 
    selectDepartment, 
    selectedDepartment,
    events
  } = useAgentCity();

  const [zoomLevel, setZoomLevel] = useState<'CITY' | 'BUILDING'>('BUILDING');
  const [filterDepartment, setFilterDepartment] = useState<DepartmentId | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Icon mapping
  const getDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'ReceiptText': return ReceiptText;
      case 'Cpu': return Cpu;
      case 'Scale': return Scale;
      case 'MessageSquare': return MessageSquare;
      case 'TrendingUp': return TrendingUp;
      case 'Server': return Server;
      case 'Package': return Package;
      case 'ShieldCheck': return ShieldCheck;
      default: return Building2;
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'ONLINE':
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' };
      case 'EXECUTING':
        return { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/50', dot: 'bg-cyan-400 animate-ping' };
      case 'THINKING':
        return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/50', dot: 'bg-purple-400 animate-pulse' };
      case 'WAITING':
        return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' };
      case 'BLOCKED':
      case 'ERROR':
        return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/50', dot: 'bg-rose-400 animate-bounce' };
      default:
        return { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', dot: 'bg-slate-500' };
    }
  };

  const filteredDepts = filterDepartment === 'ALL' 
    ? departments 
    : departments.filter(d => d.id === filterDepartment);

  const filteredAgents = agents.filter(a => {
    if (filterDepartment !== 'ALL' && a.departmentId !== filterDepartment) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return a.name.toLowerCase().includes(term) || a.role.toLowerCase().includes(term) || a.codeName.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#050506] text-[#A1A1AA] relative overflow-hidden">
      {/* City Map Header & Quick Jump Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 bg-[#0A0A0C] z-10">
        
        {/* Left: View mode and Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#111114] border border-white/10 rounded-lg p-1 text-xs">
            <button
              onClick={() => { setZoomLevel('CITY'); selectDepartment(null); }}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                zoomLevel === 'CITY' ? 'bg-[#3DFF8B]/10 text-[#3DFF8B] font-semibold border border-[#3DFF8B]/30' : 'text-white/40 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>City Map View</span>
            </button>
            <button
              onClick={() => setZoomLevel('BUILDING')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                zoomLevel === 'BUILDING' ? 'bg-[#3DFF8B]/10 text-[#3DFF8B] font-semibold border border-[#3DFF8B]/30' : 'text-white/40 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Oficina pixel</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search agent, task, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111114] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#3DFF8B]/50 w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Right: Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => { setFilterDepartment('ALL'); selectDepartment(null); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filterDepartment === 'ALL'
                ? 'bg-[#3DFF8B] text-black font-bold'
                : 'bg-[#111114] text-white/50 hover:text-white border border-white/5'
            }`}
          >
            All Districts ({agents.length})
          </button>

          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => { 
                setFilterDepartment(d.id); 
                selectDepartment(d.id);
              }}
              style={{
                borderColor: filterDepartment === d.id ? '#3DFF8B' : undefined
              }}
              className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterDepartment === d.id
                  ? 'bg-white/10 text-white font-semibold border border-[#3DFF8B]'
                  : 'bg-[#111114] text-white/50 hover:text-white border border-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
              <span>{d.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {zoomLevel === 'BUILDING' && (
        <div className="flex-1 min-h-0 relative">
          <OfficeFloorView />
        </div>
      )}

      {zoomLevel === 'CITY' && (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
        
        {/* Subtle grid background matrix */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

        {/* Floating City Ticker / Live Transit Pulse Banner */}
        <div className="mb-6 p-3 rounded-xl bg-[#0A0A0C] border border-white/10 flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#3DFF8B]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DFF8B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3DFF8B]"></span>
            </span>
            <span className="font-bold">METROPOLIS TRANSIT BUS:</span>
            <span className="text-white/80 font-sans truncate max-w-xl">
              {events[0] ? `${events[0].agentName} → ${events[0].title}` : 'Autonomous multi-agent cluster active in ACME Industries'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-white/40">
            <span>Inference GPU: <strong className="text-[#3DFF8B]">RTX 5070 Ti (Nominal)</strong></span>
            <span>Zero-Token Ratio: <strong className="text-white font-bold">99.1%</strong></span>
          </div>
        </div>

        {/* City Buildings Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
          {filteredDepts.map((dept) => {
            const Icon = getDeptIcon(dept.icon);
            const deptAgents = filteredAgents.filter(a => a.departmentId === dept.id);
            const isSelected = selectedDepartment?.id === dept.id;

            return (
              <div
                key={dept.id}
                onClick={() => selectDepartment(dept.id)}
                className={`group relative rounded-2xl bg-[#111114] border transition-all duration-300 p-5 flex flex-col justify-between cursor-pointer shadow-xl ${
                  isSelected 
                    ? 'border-[#3DFF8B]/40 ring-1 ring-[#3DFF8B]/30 shadow-[0_0_40px_-15px_rgba(61,255,139,0.15)]' 
                    : 'border-white/5 hover:border-white/15'
                }`}
                style={{
                  borderTopColor: dept.color,
                  borderTopWidth: '3px'
                }}
              >
                {/* Building Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-md"
                        style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif italic text-white text-base tracking-tight group-hover:text-[#3DFF8B] transition-colors">
                          {dept.name}
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                          FLOOR {dept.floor} • {dept.code}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                      {deptAgents.length} Agents
                    </span>
                  </div>

                  <p className="text-xs text-white/60 mb-4 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>

                  {/* Operational Metrics Sub-strip */}
                  <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">TASKS TODAY</span>
                      <span className="text-white font-bold">{dept.totalTasksToday.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">SUCCESS RATE</span>
                      <span className="text-[#3DFF8B] font-bold">{dept.successRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Agents Living in this Building */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                      Active Digital Workers
                    </span>
                    <span className="text-[9px] text-[#3DFF8B] font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3DFF8B] animate-pulse"></span>
                      24/7 Live
                    </span>
                  </div>

                  <div className="space-y-2">
                    {deptAgents.map((agent) => {
                      const badge = getStatusBadge(agent.status);
                      return (
                        <div
                          key={agent.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAgent(agent.id);
                          }}
                          className="group/agent p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar with dynamic status ring */}
                            <div className="relative flex-shrink-0 w-8 h-8 rounded-lg bg-[#0A0A0C] flex items-center justify-center text-base border border-white/10 shadow-inner">
                              <span>{agent.avatar}</span>
                              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-1 ring-[#0A0A0C] ${badge.dot}`}></span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-white truncate group-hover/agent:text-[#3DFF8B] transition-colors">
                                  {agent.name}
                                </span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-white/40 font-mono">
                                  L{agent.level}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/40 truncate">
                                {agent.role}
                              </p>
                            </div>
                          </div>

                          {/* Status Pill & Action */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {agent.status}
                            </span>
                            <ArrowRight className="w-3 h-3 text-white/20 group-hover/agent:text-[#3DFF8B] transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Building Floor Base Indicator */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Database className="w-3 h-3 text-white/30" />
                    <span>ERP Protheus • SQL Active</span>
                  </span>
                  <span className="text-[#3DFF8B] font-semibold text-[10px] group-hover:underline">
                    Inspect Floor →
                  </span>
                </div>

              </div>
            );
          })}
        </div>

      </div>
      )}
    </div>
  );
}
