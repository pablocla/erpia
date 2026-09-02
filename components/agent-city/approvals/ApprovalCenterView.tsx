'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { ApprovalRequest } from '@/types/agent-city';
import confetti from '@/lib/agent-city/confetti';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Check, 
  X, 
  FileText, 
  AlertTriangle, 
  DollarSign, 
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';

export function ApprovalCenterView() {
  const { approvals, approveRequest, rejectRequest, selectAgent } = useAgentCity();
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>(approvals[0]?.id || 'APP-823');
  const [resolutionNote, setResolutionNote] = useState('');

  const selectedApproval = approvals.find(a => a.id === selectedApprovalId) || approvals[0];

  const handleApprove = (id: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    approveRequest(id, resolutionNote || 'Authorized by Operations Director');
    setResolutionNote('');
  };

  const handleReject = (id: string) => {
    rejectRequest(id, resolutionNote || 'Operation declined by Administrator');
    setResolutionNote('');
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              HUMAN-IN-THE-LOOP APPROVAL CENTER
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                pendingCount > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {pendingCount} PENDING
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              High-value transactions, risk threshold exceptions, and ERP schema hot-patches
            </p>
          </div>
        </div>
      </div>

      {/* Main Split View: Queue & Detailed Structured Dossier */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
        
        {/* Left Col: Pending Requests Queue */}
        <div className="overflow-y-auto p-4 space-y-3 border-r border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            APPROVAL QUEUE ({approvals.length})
          </span>

          {approvals.map((app) => {
            const isSelected = selectedApproval?.id === app.id;
            const isPending = app.status === 'PENDING';

            return (
              <div
                key={app.id}
                onClick={() => setSelectedApprovalId(app.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/5'
                    : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {app.id}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      app.riskLevel === 'HIGH' ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {app.riskLevel} RISK
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    app.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                    app.status === 'REJECTED' ? 'bg-rose-950 text-rose-300 border-rose-700' :
                    'bg-purple-950 text-purple-300 border-purple-800 animate-pulse'
                  }`}>
                    {app.status}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-white line-clamp-2 mb-2">
                  {app.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>{app.requestedByAvatar} {app.requestedByAgentName}</span>
                  {app.amount && <span className="text-emerald-400 font-bold">{app.amount}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Cols: Deep Structured Dossier */}
        <div className="lg:col-span-2 overflow-y-auto p-6 space-y-6 bg-slate-950">
          {selectedApproval ? (
            <div>
              {/* Header Title and Agent Link */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedApproval.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Created at {selectedApproval.createdAt}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {selectedApproval.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {selectedApproval.reason}
                  </p>
                </div>

                <button
                  onClick={() => selectAgent(selectedApproval.requestedByAgentId)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors flex-shrink-0"
                >
                  <span>{selectedApproval.requestedByAvatar}</span>
                  <span className="font-semibold">{selectedApproval.requestedByAgentName}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              {/* 6-Part Structured Reasoning Engine */}
              <div className="space-y-4 text-xs leading-relaxed">
                
                {/* 1. What I Know */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    1. WHAT I KNOW (VERIFIED EVIDENCE)
                  </span>
                  <ul className="space-y-1 text-slate-200">
                    {selectedApproval.whatIKnow.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. What I Don't Know */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    2. WHAT I DON&apos;T KNOW (AMBIGUITY BOUNDARY)
                  </span>
                  <ul className="space-y-1 text-slate-200">
                    {selectedApproval.whatIDontKnow.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. What I Tried & 4. What Failed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
                      3. WHAT I TRIED
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {selectedApproval.whatITried.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold block">
                      4. WHAT FAILED / BLOCKED
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {selectedApproval.whatFailed.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 5. What I Recommend */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/60 space-y-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold block">
                    5. WHAT I RECOMMEND
                  </span>
                  <p className="text-slate-100 font-medium">
                    {selectedApproval.whatIRecommend}
                  </p>
                </div>

                {/* 6. What I Need From You */}
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/60 space-y-2">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
                    6. WHAT I NEED FROM YOU
                  </span>
                  <p className="text-slate-100 font-medium">
                    {selectedApproval.whatINeedFromYou}
                  </p>
                </div>

              </div>

              {/* Action Decision Box */}
              {selectedApproval.status === 'PENDING' ? (
                <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
                  <input
                    type="text"
                    placeholder="Optional administrator resolution note..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(selectedApproval.id)}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVE & EXECUTE ON ERP</span>
                    </button>

                    <button
                      onClick={() => handleReject(selectedApproval.id)}
                      className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>REJECT</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">RESOLUTION NOTE: </span>
                  <span className="text-white">{selectedApproval.resolutionNote}</span>
                  <span className="text-slate-500 block text-[10px] mt-1">Resolved at {selectedApproval.resolvedAt}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              Select an item from the approval queue to review the agent evidence dossier.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
