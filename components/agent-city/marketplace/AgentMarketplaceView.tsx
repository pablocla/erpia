'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { DepartmentId } from '@/types/agent-city';
import confetti from '@/lib/agent-city/confetti';
import { 
  Store, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  DollarSign, 
  Plus, 
  ShieldCheck, 
  Brain, 
  Wrench,
  Search,
  Filter
} from 'lucide-react';

interface MarketplaceAgentTemplate {
  id: string;
  name: string;
  role: string;
  departmentId: DepartmentId;
  avatar: string;
  description: string;
  skills: string[];
  proceduresCount: number;
  primaryModel: string;
  avgCostPerTask: string;
  monthlySavings: string;
  category: string;
}

export function AgentMarketplaceView() {
  const { createCustomAgent, setActiveTab, departments } = useAgentCity();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [hiredIds, setHiredIds] = useState<string[]>([]);

  const templates: MarketplaceAgentTemplate[] = [
    {
      id: 'tpl-arca-billing',
      name: 'ARCA/AFIP Compliance Specialist',
      role: 'Fiscal Electronic Invoice Transmitter',
      departmentId: 'BILLING',
      avatar: '🧾',
      description: 'Autonomous fiscal document validation, TSS web service integration, and automated retry on ARCA timeout with $0 token usage.',
      skills: ['ARCA/AFIP Web Services', 'TSS XML Validation', 'Protheus SF2/SD2 Tables', 'Tax Withholding RG 830'],
      proceduresCount: 68,
      primaryModel: 'Qwen3 8B AWQ (Local GPU)',
      avgCostPerTask: '$0.0003',
      monthlySavings: '$1,420/mo',
      category: 'FINANCE_BILLING'
    },
    {
      id: 'tpl-protheus-functional',
      name: 'TOTVS Protheus Functional Specialist',
      role: 'SX3 Schema & Error 400 Diagnostician',
      departmentId: 'FUNCTIONAL_SUPPORT',
      avatar: '🔬',
      description: 'Expert agent trained on 15 years of Protheus ERP error logs. Inspects table schemas, detects null foreign keys, and synthesizes SQL hot-patches.',
      skills: ['SX3 Data Dictionary', 'AppServer Error Logs', 'ADVPL Standard Routines', 'SQL Server Deadlock Resolver'],
      proceduresCount: 94,
      primaryModel: 'Qwen3 8B AWQ + GPT-5.4 Nano',
      avgCostPerTask: '$0.0008',
      monthlySavings: '$2,800/mo',
      category: 'ERP_SUPPORT'
    },
    {
      id: 'tpl-bank-conciliator',
      name: 'Autonomous Bank Conciliator',
      role: 'OFX & Wire Transfer SE1 Matcher',
      departmentId: 'ACCOUNTING',
      avatar: '📊',
      description: 'Parses raw OFX statements from Santander, Galicia, and BBVA. Reconciles 5,000+ wire receipts daily against accounts receivable ledgers.',
      skills: ['OFX Parser 2.0', 'SE1 Accounts Receivable', 'CBU/CVU Fuzzy Matching', 'Bank Fee Deduction Logic'],
      proceduresCount: 52,
      primaryModel: 'Deterministic Rules + Local LLM',
      avgCostPerTask: '$0.0001',
      monthlySavings: '$1,950/mo',
      category: 'FINANCE_BILLING'
    },
    {
      id: 'tpl-customer-whatsapp',
      name: 'Omnichannel B2B Support Agent',
      role: 'WhatsApp & Email Order Intake',
      departmentId: 'CUSTOMER_SERVICE',
      avatar: '💬',
      description: 'Engages wholesale B2B clients on WhatsApp. Resolves order tracking inquiries, parses PDF purchase orders, and generates Protheus quotes.',
      skills: ['WhatsApp Cloud API', 'PDF Purchase Order OCR', 'Live Inventory SC9 Check', 'Customer Sentiment Analysis'],
      proceduresCount: 76,
      primaryModel: 'Qwen3 8B AWQ (Local GPU)',
      avgCostPerTask: '$0.0004',
      monthlySavings: '$2,200/mo',
      category: 'CUSTOMER_OPS'
    },
    {
      id: 'tpl-logistics-dispatcher',
      name: 'Smart Logistics Dispatcher',
      role: 'Pick, Pack & Carrier Router',
      departmentId: 'OPERATIONS',
      avatar: '📦',
      description: 'Optimizes warehouse dispatch queues, balances carrier freight rates in real-time, and generates automated tracking notifications.',
      skills: ['Protheus SC9/SD2 Integration', 'Carrier Rate Optimization', 'Barcode Lot Allocation', 'Real-time ETA Dispatch'],
      proceduresCount: 44,
      primaryModel: 'Deterministic Rules Engine',
      avgCostPerTask: '$0.0000',
      monthlySavings: '$1,650/mo',
      category: 'OPERATIONS'
    },
    {
      id: 'tpl-infra-sentinel',
      name: 'AppServer & DB Sentinel',
      role: 'High-Availability Watchdog',
      departmentId: 'INFRASTRUCTURE',
      avatar: '🛡️',
      description: 'Continuous monitoring of AppServer worker threads, active license counts, query execution times, and automated memory recycling.',
      skills: ['AppServer Worker Balancing', 'License Slot Optimizer', 'Slow Query Killing', 'TLS Certificate Auto-Renew'],
      proceduresCount: 38,
      primaryModel: 'Qwen3 8B AWQ (Local GPU)',
      avgCostPerTask: '$0.0002',
      monthlySavings: '$3,100/mo',
      category: 'ERP_SUPPORT'
    }
  ];

  const handleHire = (tpl: MarketplaceAgentTemplate) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    createCustomAgent({
      name: tpl.name,
      codeName: `AGENT-${tpl.id.toUpperCase().replace('TPL-', '')}`,
      role: tpl.role,
      departmentId: tpl.departmentId,
      avatar: tpl.avatar,
      level: 1,
      skills: tpl.skills,
      primaryModel: tpl.primaryModel,
      fallbackModel: 'GPT-5.4 Nano',
      tools: ['Protheus REST API', 'SQL DB Connector', 'Event Bus Client'],
      permissions: ['READ_ERP', 'EXECUTE_ROUTINE']
    });

    setHiredIds(prev => [...prev, tpl.id]);
  };

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return t.name.toLowerCase().includes(term) || t.role.toLowerCase().includes(term) || t.description.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AUTONOMOUS WORKFORCE MARKETPLACE
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                ENTERPRISE READY
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Pre-trained digital employees with verified ERP procedures, zero-token cost models, and instant deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Pricing Model:</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 font-bold">
            $0 / Token • Fixed Monthly or On-Prem
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          {['ALL', 'FINANCE_BILLING', 'ERP_SUPPORT', 'CUSTOMER_OPS', 'OPERATIONS'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search templates, skills, ERP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => {
          const isHired = hiredIds.includes(tpl.id);

          return (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 shadow-md">
                      {tpl.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {tpl.role}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {tpl.departmentId}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {tpl.description}
                </p>

                {/* Verified Procedures & Model Pill */}
                <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">VERIFIED PROCEDURES</span>
                    <span className="text-emerald-400 font-bold">{tpl.proceduresCount} Rules</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVG COST / TASK</span>
                    <span className="text-cyan-300 font-bold">{tpl.avgCostPerTask}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Core Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tpl.skills.map((skill, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 font-mono">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hire Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-emerald-400 font-bold">
                  Est. Savings: {tpl.monthlySavings}
                </div>

                <button
                  onClick={() => handleHire(tpl)}
                  disabled={isHired}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                    isHired 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 cursor-default' 
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95'
                  }`}
                >
                  {isHired ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isHired ? 'Employed in City' : 'Hire & Deploy'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
