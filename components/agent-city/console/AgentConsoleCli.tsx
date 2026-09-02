'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { Terminal, Send, Trash2, HelpCircle, Sparkles, Play } from 'lucide-react';

export function AgentConsoleCli() {
  const { executeConsoleCommand } = useAgentCity();
  const [inputVal, setInputVal] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; timestamp: string; command?: string; text: string; type: 'system' | 'info' | 'success' | 'warning' | 'error' }>>([
    {
      id: 'init-1',
      timestamp: '14:32:00',
      type: 'system',
      text: `╔══════════════════════════════════════════════════════════════════════╗
║               AGENT CITY METROPOLIS OPERATING SYSTEM v2.4             ║
║     Autonomous Enterprise Multi-Agent Grid (Local-First AI Engine)   ║
╚══════════════════════════════════════════════════════════════════════╝
Ready. Type "help" to list commands or use quick buttons below.`
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const runCommand = (cmd: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    const res = executeConsoleCommand(cmd);

    setConsoleLogs(prev => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        timestamp: time,
        command: cmd,
        text: res.output,
        type: res.status === 'error' ? 'error' : res.status === 'success' ? 'success' : 'info'
      }
    ]);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const cmd = inputVal.trim();
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal('');
    runCommand(cmd);
  };

  const clearConsole = () => {
    setConsoleLogs([
      {
        id: `clear-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        type: 'system',
        text: 'Console buffer cleared.'
      }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    }
  };

  const quickCommands = [
    'inspect invoice 18392',
    'diagnose',
    'status',
    'cost',
    'tools',
    'simulate invoice_error',
    'simulate bank_sync',
    'help'
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-mono overflow-hidden">
      
      {/* Terminal Title Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="font-bold text-slate-300 ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>AGENT_CITY_CLI // ROOT ORCHESTRATOR TERMINAL</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearConsole}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Suggestion Pills */}
      <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
        <span className="text-slate-500 flex-shrink-0">Quick Run:</span>
        {quickCommands.map((cmd, i) => (
          <button
            key={i}
            onClick={() => runCommand(cmd)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 whitespace-nowrap hover:border-cyan-500/50 transition-colors"
          >
            $ {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs leading-relaxed">
        {consoleLogs.map((log) => {
          let textClass = 'text-slate-300';
          if (log.type === 'error') textClass = 'text-rose-400';
          if (log.type === 'warning') textClass = 'text-amber-400';
          if (log.type === 'success') textClass = 'text-emerald-400';
          if (log.type === 'system') textClass = 'text-cyan-300 font-semibold';

          return (
            <div key={log.id} className="flex items-start gap-2.5">
              <span className="text-slate-600 select-none flex-shrink-0">
                [{log.timestamp}]
              </span>
              {log.command && (
                <span className="text-cyan-400 font-bold flex-shrink-0">
                  ❯ {log.command}
                </span>
              )}
              <div className={`whitespace-pre-wrap ${textClass} flex-1`}>
                {log.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Command Input Form */}
      <form onSubmit={handleCommandSubmit} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-3">
        <span className="text-cyan-400 font-bold select-none text-sm">❯</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. 'inspect invoice 18392', 'diagnose', 'cost', 'help')..."
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-mono"
          autoFocus
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
        >
          <Send className="w-3 h-3" />
          <span>Exec</span>
        </button>
      </form>

    </div>
  );
}
