'use client';

import React, { useState } from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Cpu, 
  Database, 
  Layers, 
  ShieldCheck, 
  DollarSign, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export function ScenarioPlaygroundView() {
  const { triggerCustomScenario, executeConsoleCommand, agents } = useAgentCity();
  const [selectedScenario, setSelectedScenario] = useState<string>('invoice_error');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSteps, setSimulationSteps] = useState<Array<{ step: string; status: 'DONE' | 'RUNNING' | 'PENDING'; tier: string; cost: string; delay: number }>>([]);

  const scenarioCatalog = [
    {
      id: 'invoice_error',
      title: 'ARCA / Protheus Invoice Rejection (D2_TES Null)',
      description: 'Customer order SO-9182 transmitted to billing. Billing Agent encounters D2_TES field null error. Escalates to Functional Agent who verifies schema in SX3 table.',
      expectedModel: 'Deterministic Rules → Local Qwen3 8B',
      expectedCost: '$0.0000 (100% Local)',
      duration: '450ms'
    },
    {
      id: 'bank_sync',
      title: 'OFX Bank Reconciliation Batch (86 Wire Receipts)',
      description: 'Incoming OFX bank statement from Santander. Conciliation Agent fuzzy-matches 86 transaction IDs against Protheus SE1 accounts receivable.',
      expectedModel: 'Deterministic Rules (Code Engine)',
      expectedCost: '$0.0000 (0 Tokens)',
      duration: '180ms'
    },
    {
      id: 'credit_approval',
      title: 'High-Value Credit Limit Exception ($850,000)',
      description: 'Industrial client requests wholesale purchase order exceeding standard credit limit. Evaluated by Risk Agent and forwarded to Human Approval Center.',
      expectedModel: 'Local Model + Human-in-the-Loop',
      expectedCost: '$0.0004',
      duration: '320ms'
    }
  ];

  const handleRunScenario = () => {
    setIsRunning(true);
    triggerCustomScenario(selectedScenario as any);

    if (selectedScenario === 'invoice_error') {
      setSimulationSteps([
        { step: '1. Event Bus receives Invoice Generation Trigger for Customer ACME-9182', status: 'RUNNING', tier: 'Event Bus', cost: '$0.00', delay: 200 },
        { step: '2. Billing Agent validates SF2/SD2 headers in Protheus REST API', status: 'PENDING', tier: 'Code / REST', cost: '$0.00', delay: 600 },
        { step: '3. ARCA Web Service responds HTTP 400: "Field D2_TES is required for RG 830"', status: 'PENDING', tier: 'TSS Gateway', cost: '$0.00', delay: 1000 },
        { step: '4. Autonomous Escalation to Functional ERP Support Agent (INC-5821 opened)', status: 'PENDING', tier: 'Local Qwen 8B', cost: '$0.00', delay: 1500 },
        { step: '5. Functional Agent queries SX3 Data Dictionary: Column definition missing', status: 'PENDING', tier: 'SQL / Code', cost: '$0.00', delay: 2000 },
        { step: '6. Synthesizing hot-patch and routing to Human Approval Center (#APP-824)', status: 'PENDING', tier: 'Local AI', cost: '$0.00', delay: 2600 },
      ]);
    } else if (selectedScenario === 'bank_sync') {
      setSimulationSteps([
        { step: '1. Ingesting daily Santander OFX stream from secure FTP storage', status: 'RUNNING', tier: 'IO Stream', cost: '$0.00', delay: 200 },
        { step: '2. Parsing 86 bank statement transaction blocks with deterministic rules', status: 'PENDING', tier: 'Rules Engine', cost: '$0.00', delay: 500 },
        { step: '3. Querying Protheus SE1 ledger: 84 records exact match on CBU and Invoice #', status: 'PENDING', tier: 'SQL Connector', cost: '$0.00', delay: 900 },
        { step: '4. 2 wire receipts fuzzy-matched with customer tax ID (99.8% confidence)', status: 'PENDING', tier: 'Local Qwen 8B', cost: '$0.00', delay: 1300 },
        { step: '5. Automatic posting of accounts receivable balance into ERP ($0 tokens)', status: 'PENDING', tier: 'Code Engine', cost: '$0.00', delay: 1700 },
      ]);
    } else {
      setSimulationSteps([
        { step: '1. B2B Sales Order SO-9941 received for $850,000 industrial hardware', status: 'RUNNING', tier: 'Event Bus', cost: '$0.00', delay: 200 },
        { step: '2. Risk Evaluator checks Protheus SA1 customer credit ceiling ($500,000 limit)', status: 'PENDING', tier: 'SQL Engine', cost: '$0.00', delay: 600 },
        { step: '3. Exceeds autonomous threshold ($50,000 max). Formulating 6-part dossier.', status: 'PENDING', tier: 'Local Qwen 8B', cost: '$0.0004', delay: 1100 },
        { step: '4. Packaging structured dossier into Human Approval Center (#APP-823)', status: 'PENDING', tier: 'Agent City OS', cost: '$0.00', delay: 1600 },
      ]);
    }

    // Step by step animation timer
    [200, 600, 1000, 1500, 2000, 2600].forEach((delay, idx) => {
      setTimeout(() => {
        setSimulationSteps(prev => 
          prev.map((s, i) => {
            if (i < idx) return { ...s, status: 'DONE' };
            if (i === idx) return { ...s, status: 'RUNNING' };
            return s;
          })
        );
        if (idx === 5 || idx >= simulationSteps.length - 1) {
          setIsRunning(false);
        }
      }, delay);
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SCENARIO & TEST BENCH PLAYGROUND
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 font-mono">
                SANDBOX ISOLATION
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Execute complex enterprise workflows without modifying production records to observe model routing and token efficiency
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioCatalog.map((sc) => {
          const isSelected = selectedScenario === sc.id;

          return (
            <div
              key={sc.id}
              onClick={() => setSelectedScenario(sc.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/20 shadow-xl'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
              }`}
            >
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white mb-1.5">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Routing:</span>
                  <span className="text-emerald-400 font-bold">{sc.expectedModel}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cost:</span>
                  <span className="text-cyan-300 font-bold">{sc.expectedCost}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Test Bench */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              STEP-BY-STEP AGENT EXECUTION TRACE
            </h3>
          </div>

          <button
            onClick={handleRunScenario}
            disabled={isRunning}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Simulating Workflow...' : 'Inject & Run Scenario'}</span>
          </button>
        </div>

        {simulationSteps.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-xs">
            Select a business scenario above and click &quot;Inject &amp; Run Scenario&quot; to watch the multi-agent hierarchy resolve it live.
          </div>
        ) : (
          <div className="space-y-2.5">
            {simulationSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 transition-all ${
                  step.status === 'DONE'
                    ? 'bg-slate-950/80 border-emerald-500/40 text-slate-200'
                    : step.status === 'RUNNING'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {step.status === 'DONE' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : step.status === 'RUNNING' ? (
                    <Cpu className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0"></span>
                  )}
                  <span className="truncate">{step.step}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {step.tier}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {step.cost}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
