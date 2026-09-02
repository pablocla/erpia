'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { DepartmentId } from '@/types/agent-city';
import confetti from '@/lib/agent-city/confetti';
import { 
  X, 
  Plus, 
  Cpu, 
  Shield, 
  Wrench, 
  Sparkles, 
  CheckCircle2,
  Layers,
  Database
} from 'lucide-react';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const { createCustomAgent, departments } = useAgentCity();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [departmentId, setDepartmentId] = useState<DepartmentId>('BILLING');
  const [avatar, setAvatar] = useState('🤖');
  const [primaryModel, setPrimaryModel] = useState('Qwen3 8B AWQ (Local GPU)');
  const [fallbackModel, setFallbackModel] = useState('GPT-5.4 Nano ($0.20/M)');
  const [skillsInput, setSkillsInput] = useState('Protheus REST, SX3 Schema, ARCA TSS');
  const [selectedTools, setSelectedTools] = useState<string[]>(['Protheus REST API', 'SQL DB Connector']);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    createCustomAgent({
      name,
      codeName: `AGENT-${name.toUpperCase().replace(/\s+/g, '-').slice(0, 10)}`,
      role,
      departmentId,
      avatar,
      level: 1,
      skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      primaryModel,
      fallbackModel,
      tools: selectedTools,
      permissions: ['READ_ERP', 'EXECUTE_ROUTINE']
    });

    onClose();
  };

  const avatarOptions = ['🤖', '🔬', '🧾', '📊', '💬', '📈', '🛡️', '📦', '⚖️', '🧠'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Hire Autonomous Digital Worker</h3>
              <p className="text-xs text-slate-400 font-mono">Deploy a 24/7 worker into Agent City with zero-token local execution</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          
          {/* Avatar Selector */}
          <div>
            <label className="block text-slate-400 font-mono mb-1.5">AGENT AVATAR</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {avatarOptions.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                    avatar === av 
                      ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/30' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono mb-1">AGENT NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Tax Calculation Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono mb-1">SPECIALIZED ROLE</label>
              <input
                type="text"
                required
                placeholder="e.g. RG 830 Withholding Specialist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-slate-400 font-mono mb-1">ASSIGN TO DEPARTMENT / BUILDING</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value as DepartmentId)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (Floor {d.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Intelligence Tier Routing */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
              MODEL ROUTING HIERARCHY
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">PRIMARY LOCAL MODEL ($0)</label>
                <select
                  value={primaryModel}
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  <option value="Qwen3 8B AWQ (Local GPU)">Qwen3 8B AWQ (Local RTX 5070 Ti)</option>
                  <option value="Deterministic Rules Engine">Deterministic Code Rules ($0)</option>
                  <option value="DeepSeek R1 Distill 8B">DeepSeek R1 Distill 8B Local</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">FALLBACK CHEAP API</label>
                <select
                  value={fallbackModel}
                  onChange={(e) => setFallbackModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  <option value="GPT-5.4 Nano ($0.20/M)">GPT-5.4 Nano ($0.20/M tokens)</option>
                  <option value="GPT-5.4 Mini ($0.75/M)">GPT-5.4 Mini ($0.75/M tokens)</option>
                  <option value="Gemini 3.5 Flash">Gemini 3.5 Flash ($0.10/M)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills tags */}
          <div>
            <label className="block text-slate-400 font-mono mb-1">SKILLS & KNOWLEDGE BASE (COMMA-SEPARATED)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
            />
          </div>

          {/* Authorized Tools */}
          <div>
            <label className="block text-slate-400 font-mono mb-1.5">AUTHORIZED TOOL CONNECTORS</label>
            <div className="grid grid-cols-2 gap-2">
              {['Protheus REST API', 'SQL DB Connector', 'ARCA TSS Gateway', 'OFX Bank Parser', 'WhatsApp Business API'].map(tool => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    type="button"
                    key={tool}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTools(selectedTools.filter(t => t !== tool));
                      } else {
                        setSelectedTools([...selectedTools, tool]);
                      }
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      isSelected 
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-semibold' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{tool}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              Deploy Agent into Metropolis
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
