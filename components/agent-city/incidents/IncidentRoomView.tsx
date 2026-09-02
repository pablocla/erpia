'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { Incident } from '@/types/agent-city';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Brain,
  FileCode2, 
  Layers, 
  Users, 
  Wrench, 
  DollarSign, 
  ArrowRight,
  Database,
  Search,
  Sparkles
} from 'lucide-react';

export function IncidentRoomView() {
  const { incidents, resolveIncident, selectAgent, approveRequest, approvals } = useAgentCity();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || 'INC-5821');

  const incident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400 font-mono">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
        <h3 className="text-base font-bold text-white">All Enterprise Systems Nominal</h3>
        <p className="text-xs">No active incident war rooms currently open.</p>
      </div>
    );
  }

  const isResolved = incident.status === 'RESOLVED';
  const relatedPatchApproval = approvals.find(a => a.id === 'APP-824');

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Incident War Room Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
            isResolved 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
              : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {incident.id}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isResolved 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                  : 'bg-rose-950 text-rose-300 border-rose-700'
              }`}>
                {incident.status}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                SEVERITY: {incident.severity}
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-1">
              {incident.title}
            </h2>
          </div>
        </div>

        {/* Quick War-Room Metrics */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">COLLABORATIVE AGENTS</span>
            <span className="text-white font-bold">{incident.participatingAgentIds.length} Autonomous Agents</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">ROOT CAUSE CONFIDENCE</span>
            <span className="text-emerald-400 font-bold">{(incident.confidenceScore * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Main War Room Content Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
        
        {/* Left 2 Cols: Collaborative Hypotheses & Evidence Matrix */}
        <div className="lg:col-span-2 overflow-y-auto p-5 sm:p-6 space-y-6 border-r border-slate-800/80">
          
          {/* Current Live Investigation Status */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                ORCHESTRATOR STEP-BY-STEP WORKFLOW
              </span>
              <span className="text-[10px] font-mono text-slate-500">{incident.startedAt}</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {incident.currentStep}
            </p>
          </div>

          {/* Collaborative Hypotheses Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>Multi-Agent Hypotheses Matrix ({incident.hypotheses.length})</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Structured State Reasoning</span>
            </div>

            <div className="space-y-3">
              {incident.hypotheses.map((hyp) => {
                const isConfirmed = hyp.status === 'CONFIRMED';
                const isDisproven = hyp.status === 'DISPROVEN';

                return (
                  <div
                    key={hyp.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isConfirmed
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                        : isDisproven
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                          PROPOSED BY: {hyp.proposedBy}
                        </span>
                        <h4 className="font-bold text-xs text-slate-100">
                          {hyp.hypothesis}
                        </h4>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isConfirmed
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : isDisproven
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        }`}>
                          {hyp.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Confidence: {(hyp.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-mono">
                      {hyp.reasoning}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidence Locker */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider mb-3 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Evidence Locker & Raw Telemetry ({incident.evidence.length})</span>
            </h3>

            <div className="space-y-3">
              {incident.evidence.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300">{ev.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">{ev.sourceAgent} • {ev.timestamp}</span>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800/80">
                    {ev.data}
                  </pre>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Resolution & Action Engine */}
        <div className="bg-slate-900/60 p-5 overflow-y-auto space-y-5">
          
          {/* Root Cause & Fix Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
              SYNTHESIZED ROOT CAUSE
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {incident.rootCause}
            </p>

            {incident.suggestedFix && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block">
                  RECOMMENDED SYSTEM REMEDIATION
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {incident.suggestedFix}
                </p>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-3">
            {relatedPatchApproval && relatedPatchApproval.status === 'PENDING' && !isResolved && (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/60 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Schema Patch #APP-824 Pending Human Approval</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The agents synthesized the exact SQL patch to fix the SX3 table. Approve to execute immediately in Protheus.
                </p>
                <button
                  onClick={() => approveRequest(relatedPatchApproval.id, 'Approved via Incident War Room')}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execute Approved Hot-Patch Now</span>
                </button>
              </div>
            )}

            {!isResolved ? (
              <button
                onClick={() => resolveIncident(incident.id, 'Remediation verified by multi-agent war room. SX3 table updated.')}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Incident as Fully Resolved</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center text-xs font-mono text-emerald-300">
                ✓ Incident Resolved and archived to Organizational Knowledge Base
              </div>
            )}
          </div>

          {/* Participating Agents Quick Links */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              PARTICIPATING WAR-ROOM AGENTS
            </span>
            <div className="space-y-1.5">
              {incident.participatingAgentIds.map(agentId => (
                <button
                  key={agentId}
                  onClick={() => selectAgent(agentId)}
                  className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 transition-colors"
                >
                  <span className="truncate">{agentId}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
