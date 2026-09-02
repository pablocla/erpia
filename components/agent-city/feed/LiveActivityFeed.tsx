'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { ActivityEvent, ModelTier, DepartmentId } from '@/types/agent-city';
import { 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ShieldAlert, 
  Cpu, 
  Clock, 
  Zap, 
  DollarSign, 
  Pause, 
  Play, 
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export function LiveActivityFeed() {
  const { 
    events, 
    isLiveFeedPaused, 
    setIsLiveFeedPaused, 
    selectAgent,
    departments 
  } = useAgentCity();

  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(events[0] || null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterModel, setFilterModel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Icon & color helper by type
  const getEventBadge = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'investigating':
        return { icon: Clock, bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
      case 'warning':
        return { icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'error':
        return { icon: AlertCircle, bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
      case 'approval':
        return { icon: ShieldAlert, bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
      default:
        return { icon: Info, bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterType !== 'ALL' && e.type !== filterType) return false;
    if (filterDept !== 'ALL' && e.departmentId !== filterDept) return false;
    if (filterModel === 'LOCAL' && !(e.modelTier === 'RULE_ENGINE' || e.modelTier.includes('LOCAL'))) return false;
    if (filterModel === 'API' && (e.modelTier === 'RULE_ENGINE' || e.modelTier.includes('LOCAL'))) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.title.toLowerCase().includes(term) ||
        e.details.toLowerCase().includes(term) ||
        e.agentName.toLowerCase().includes(term) ||
        (e.targetDoc && e.targetDoc.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Filter Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Title & Live Ticker */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              REAL-TIME ENTERPRISE EVENT BUS
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                STREAMING
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Capturing all ERP signals, tool calls, SQL lookups, and autonomous agent decisions
            </p>
          </div>
        </div>

        {/* Right: Search & Pause */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search event, doc ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={() => setIsLiveFeedPaused(!isLiveFeedPaused)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              isLiveFeedPaused
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isLiveFeedPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isLiveFeedPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-500 font-mono text-[11px] mr-1">Filter:</span>
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
            filterType === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Signals ({events.length})
        </button>
        <button
          onClick={() => setFilterType('success')}
          className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
            filterType === 'success' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Success Ops
        </button>
        <button
          onClick={() => setFilterType('investigating')}
          className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
            filterType === 'investigating' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          Investigations
        </button>
        <button
          onClick={() => setFilterType('approval')}
          className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
            filterType === 'approval' ? 'bg-purple-500 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          Approvals
        </button>
        <button
          onClick={() => setFilterType('error')}
          className={`px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
            filterType === 'error' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          Errors / Retries
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        <button
          onClick={() => setFilterModel(filterModel === 'LOCAL' ? 'ALL' : 'LOCAL')}
          className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition-colors ${
            filterModel === 'LOCAL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          ⚡ $0 Tokens (Local/Code)
        </button>
      </div>

      {/* Main Events List & Inspection Drawer Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
        
        {/* Events Timeline Stream */}
        <div className="lg:col-span-2 overflow-y-auto p-4 space-y-2.5 border-r border-slate-800/80">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              No events matched the current filter.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const badge = getEventBadge(event.type);
              const Icon = badge.icon;
              const isSelected = selectedEvent?.id === event.id;

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/5'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Timestamp & Type Icon */}
                    <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${badge.bg} ${badge.border} ${badge.text}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        {event.timestamp}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {event.agentName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {event.departmentId}
                        </span>
                        {event.targetDoc && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                            {event.targetDoc}
                          </span>
                        )}
                      </div>

                      <h4 className="font-medium text-xs text-slate-100 mt-1">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {event.details}
                      </p>
                    </div>
                  </div>

                  {/* Model & Cost Pill */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {event.modelName.includes('Rule') ? '$0.00 (Code)' : event.modelTier.includes('LOCAL') ? '$0.00 (Local Qwen)' : `$${event.cost}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {event.latencyMs}ms
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Event Deep Dossier Panel */}
        <div className="bg-slate-900/60 p-5 overflow-y-auto hidden lg:block">
          {selectedEvent ? (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  EVENT SIGNAL INSPECTOR
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  ID: {selectedEvent.id}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-2">
                {selectedEvent.title}
              </h3>
              
              <p className="text-xs text-slate-300 leading-relaxed mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                {selectedEvent.details}
              </p>

              {/* Execution Metadata Grid */}
              <div className="space-y-2 mb-5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-400">EXECUTING AGENT:</span>
                  <button 
                    onClick={() => selectAgent(selectedEvent.agentId)}
                    className="text-cyan-300 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>{selectedEvent.agentName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-400">DEPARTMENT:</span>
                  <span className="text-slate-200">{selectedEvent.departmentId}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-400">INTELLIGENCE TIER:</span>
                  <span className="text-emerald-400 font-bold">{selectedEvent.modelName}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-400">TOOL INVOKED:</span>
                  <span className="text-cyan-300">{selectedEvent.toolUsed || 'None (Autonomous Rule)'}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-400">INFERENCE COST:</span>
                  <span className="text-amber-400 font-bold">${selectedEvent.cost}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-400">ROUNDTRIP LATENCY:</span>
                  <span className="text-slate-200">{selectedEvent.latencyMs} ms</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => selectAgent(selectedEvent.agentId)}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Talk with {selectedEvent.agentName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              Select an event from the timeline to inspect its technical trace and payload.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
