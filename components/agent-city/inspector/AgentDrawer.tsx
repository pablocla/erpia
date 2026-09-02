'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { Agent, AgentActionTrace } from '@/types/agent-city';
import { 
  X, 
  MessageSquare, 
  Brain, 
  Wrench, 
  History, 
  DollarSign, 
  Shield, 
  Play, 
  Pause, 
  Send, 
  Cpu, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Layers,
  FileCode2,
  Lock
} from 'lucide-react';

export function AgentDrawer() {
  const { selectedAgent, selectAgent, sendAgentMessage } = useAgentCity();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHAT' | 'MEMORY' | 'TOOLS' | 'LOGS' | 'COST'>('OVERVIEW');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; traces?: any[]; modelUsed?: string }>>([
    {
      sender: 'agent',
      text: 'Saludos. Estoy en línea 24/7 procesando eventos en el ERP Protheus. ¿En qué operación o diagnóstico requieres asistencia?',
      modelUsed: 'Qwen3 8B AWQ (Local GPU)'
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  if (!selectedAgent) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsSending(true);

    try {
      const response = await sendAgentMessage(selectedAgent.id, userText);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: response.reply,
          traces: response.traces,
          modelUsed: response.modelUsed
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: 'Error en la respuesta del agente. Se mantiene la sesión local.',
          modelUsed: 'Local Fallback'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] md:w-[620px] bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-right duration-300">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 shadow-md">
              {selectedAgent.avatar}
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {selectedAgent.name}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                LEVEL {selectedAgent.level}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {selectedAgent.role} • {selectedAgent.codeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isPaused ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isPaused ? 'Resume Agent' : 'Pause Agent'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => selectAgent(null)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950 overflow-x-auto no-scrollbar gap-1 text-xs">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Layers },
          { id: 'CHAT', label: 'Talk & Traces', icon: MessageSquare },
          { id: 'MEMORY', label: 'Memory Vault', icon: Brain },
          { id: 'TOOLS', label: 'Tools & Security', icon: Wrench },
          { id: 'LOGS', label: 'Action Trace', icon: History },
          { id: 'COST', label: 'Cost Engine', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-5 text-xs">
            {/* Live Operational Status */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  CURRENT OPERATIONAL STATE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedAgent.status}
                </span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-medium">
                {selectedAgent.statusMessage || 'Idle in queue. Polling ERP Event Bus for incoming invoices and messages.'}
              </p>
            </div>

            {/* Current Active Task Progress (if active) */}
            {selectedAgent.currentTask && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-xs">
                    {selectedAgent.currentTask.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {selectedAgent.currentTask.startedAt}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  {selectedAgent.currentTask.step}
                </p>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>PROGRESS</span>
                    <span>{selectedAgent.currentTask.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${selectedAgent.currentTask.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TASKS TODAY</span>
                <span className="text-white font-bold text-sm">{selectedAgent.tasksToday.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SUCCESS RATE</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedAgent.successRate}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">AVG COST/OP</span>
                <span className="text-cyan-300 font-bold text-sm">${selectedAgent.avgCost}</span>
              </div>
            </div>

            {/* Model Architecture Stack */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                INTELLIGENCE ROUTING HIERARCHY
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                  <span className="text-slate-300">Level 0 & 1: Deterministic & Local GPU</span>
                  <span className="text-emerald-400 font-bold font-mono">Qwen3 8B AWQ ($0)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Level 2: Cheap API Fallback</span>
                  <span className="text-cyan-300 font-mono">GPT-5.4 Nano ($0.20/M)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Level 3: Critical Reasoning</span>
                  <span className="text-purple-300 font-mono">Gemini 3.5 Pro / GPT-5.4</span>
                </div>
              </div>
            </div>

            {/* Skills & Badges */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                VERIFIED SPECIALIST SKILLS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.skills.map((skill, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Button to Chat */}
            <button
              onClick={() => setActiveTab('CHAT')}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Instruct & Chat with {selectedAgent.name}</span>
            </button>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CHAT & TOOL TRACES */}
        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-[520px]">
            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-md leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none' 
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Step-by-Step Action Traces */}
                    {msg.traces && msg.traces.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                          ⚡ Autonomous Tool & SQL Traces
                        </span>
                        {msg.traces.map((trace, tIdx) => (
                          <div key={tIdx} className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-start gap-2">
                            <span className="text-slate-500 flex-shrink-0">{trace.timestamp}</span>
                            <span className="text-cyan-400 font-semibold">[{trace.tool}]</span>
                            <span className="truncate">{trace.action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.modelUsed && (
                    <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                      Inference: {msg.modelUsed}
                    </span>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-mono">
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>{selectedAgent.name} is evaluating rules & querying SQL...</span>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder={`Ask ${selectedAgent.name} (e.g. "¿Por qué falló la factura 18392?")...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isSending || !chatInput.trim()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: MEMORY VAULT */}
        {activeTab === 'MEMORY' && (
          <div className="space-y-4 text-xs">
            {/* Short Term Memory */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                  SHORT-TERM CONTEXT (CURRENT SESSION)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Transient Buffer</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {selectedAgent.memory.shortTerm.currentContext}
              </p>
              <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-400">
                Variables: {JSON.stringify(selectedAgent.memory.shortTerm.lastVariables)}
              </div>
            </div>

            {/* Long Term Memory */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                  LONG-TERM VERIFIED KNOWLEDGE ({selectedAgent.memory.longTerm.verifiedProceduresCount} Procedures)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Vector Embeddings</span>
              </div>
              <div className="space-y-2">
                {selectedAgent.memory.longTerm.snippets.map((snip, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{snip.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{snip.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {snip.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Organizational Memory */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold block">
                ORGANIZATIONAL POLICY CONSTRAINTS
              </span>
              <div className="space-y-1">
                {selectedAgent.memory.organizationalMemory.companyRulesLoaded.map((rule, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-950 text-slate-300 font-mono text-[11px] flex items-center gap-2">
                    <Lock className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TOOLS & SECURITY */}
        {activeTab === 'TOOLS' && (
          <div className="space-y-4 text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              AUTHORIZED TOOL REGISTRY & RBAC PERMISSIONS
            </span>
            <div className="space-y-2">
              {selectedAgent.tools.map((tool, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200">{tool}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    GRANTED
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                SECURITY POLICY PERMISSIONS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.permissions.map((perm, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ACTION LOGS */}
        {activeTab === 'LOGS' && (
          <div className="space-y-2 text-xs font-mono">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              LIVE ACTION AUDIT LOGS
            </span>
            {selectedAgent.recentActions.map((act) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{act.timestamp}</span>
                  <span className="text-emerald-400 font-bold">{act.tool || 'Engine'}</span>
                </div>
                <p className="text-slate-200 font-medium">
                  {act.action}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>Latency: {act.durationMs}ms</span>
                  <span>Cost: ${act.cost}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: COST ENGINE */}
        {activeTab === 'COST' && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                UNIT ECONOMICS BREAKDOWN (TODAY)
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950">
                  <span className="text-slate-400">Total Tasks Resolved:</span>
                  <span className="text-white font-bold">{selectedAgent.tasksToday.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950">
                  <span className="text-slate-400">Total Inference Cost:</span>
                  <span className="text-amber-400 font-bold">${selectedAgent.totalCostToday}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-950/40 border border-emerald-800/40">
                  <span className="text-slate-300">Cost Per Operation:</span>
                  <span className="text-emerald-400 font-bold">${selectedAgent.avgCost}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
