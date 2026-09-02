'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { 
  Wrench, 
  Database, 
  Server, 
  Send, 
  FileCode2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Search,
  ExternalLink,
  Code,
  Lock
} from 'lucide-react';

export function ToolRegistryView() {
  const { tools } = useAgentCity();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  const filteredTools = tools.filter(t => {
    if (selectedRisk !== 'ALL' && t.risk !== selectedRisk) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return t.name.toLowerCase().includes(term) || t.description.toLowerCase().includes(term) || t.system.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              ENTERPRISE TOOL & CONNECTOR REGISTRY
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                {tools.length} REGISTERED TOOLS
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic code connectors with fine-grained RBAC permission boundaries & audit logs
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tools, schemas, ERP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedRisk === risk ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTools.map((tool) => {
          const isHighRisk = tool.risk === 'HIGH';
          const isMedRisk = tool.risk === 'MEDIUM';

          return (
            <div
              key={tool.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tool.system}
                    </span>
                    <h3 className="font-bold text-sm text-white mt-1.5 group-hover:text-cyan-300 transition-colors">
                      {tool.name}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isHighRisk ? 'bg-rose-950 text-rose-300 border-rose-800' :
                    isMedRisk ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {tool.risk} RISK
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {tool.description}
                </p>

                {/* JSON Schema Preview */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px]">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    PARAM SCHEMA
                  </span>
                  <pre className="text-cyan-300 overflow-x-auto">
                    {tool.inputSchema}
                  </pre>
                </div>
              </div>

              {/* Bottom stats & permissions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{tool.callsToday.toLocaleString()} calls today</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Lock className="w-3 h-3" />
                  <span>{tool.requiresApproval ? 'Human Approval Req.' : 'Autonomous Exec'}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
