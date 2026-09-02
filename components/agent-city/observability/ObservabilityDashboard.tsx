'use client';

import React from 'react';
import { useAgentCity } from '@/lib/agent-city/agent-city-state';
import { 
  BarChart3, 
  Cpu, 
  DollarSign, 
  Activity, 
  Zap, 
  TrendingDown, 
  Layers, 
  Server, 
  CheckCircle2, 
  ArrowUpRight,
  HardDrive,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export function ObservabilityDashboard() {
  const { metrics, departments, agents } = useAgentCity();

  // Hourly operational volume simulation data
  const throughputData = [
    { time: '08:00', localOps: 1420, cloudOps: 12, cost: 0.8 },
    { time: '09:00', localOps: 3200, cloudOps: 28, cost: 1.4 },
    { time: '10:00', localOps: 4800, cloudOps: 45, cost: 2.1 },
    { time: '11:00', localOps: 5600, cloudOps: 52, cost: 2.9 },
    { time: '12:00', localOps: 3900, cloudOps: 31, cost: 1.8 },
    { time: '13:00', localOps: 4200, cloudOps: 39, cost: 2.0 },
    { time: '14:00', localOps: 6100, cloudOps: 61, cost: 3.4 },
    { time: '15:00', localOps: 5800, cloudOps: 48, cost: 2.6 },
    { time: '16:00', localOps: 3371, cloudOps: 26, cost: 1.3 },
  ];

  // Model distribution data
  const modelTierData = [
    { name: 'Deterministic Rules (Code)', value: 89.2, color: '#10b981' },
    { name: 'Local GPU (Qwen3 8B AWQ)', value: 9.9, color: '#06b6d4' },
    { name: 'Cheap API (GPT-5.4 Nano)', value: 0.86, color: '#f59e0b' },
    { name: 'Reasoning API (Gemini/GPT)', value: 0.04, color: '#8b5cf6' },
  ];

  // Department cost breakdown
  const deptCostData = departments.map(d => ({
    name: d.name.split(' ')[0],
    tasks: d.totalTasksToday,
    cost: (d.totalTasksToday * 0.00048).toFixed(2),
    successRate: d.successRate
  }));

  const traditionalSaasCost = (metrics.tasksToday * 0.022).toFixed(2);
  const netSavings = (parseFloat(traditionalSaasCost) - metrics.totalAiCost).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              REAL-TIME OBSERVABILITY & UNIT ECONOMICS
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                99.1% $0-TOKEN RATIO
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Inference costs, latency percentiles, GPU utilization, and local AI vs cloud API telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span>Target Architecture:</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
            Code → Local LLM → Cheap API → Premium
          </span>
        </div>
      </div>

      {/* Top 4 Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>RESOLVED TASKS TODAY</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.tasksToday.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono mt-2">
            <span>↑ +18.4% vs yesterday</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">{metrics.successRate}% Success</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>REAL AVG COST / OPERATION</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 tracking-tight font-mono">
            ${metrics.avgCostPerTask}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2">
            Fraction of a cent ($0.48 per 1,000 tasks)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>TOTAL AI CLOUD SPEND TODAY</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
            ${metrics.totalAiCost}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2">
            Traditional pure API would be: <strong className="text-rose-400">${traditionalSaasCost}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-mono mb-2">
            <span>NET VALUE CREATED / SAVED</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 tracking-tight font-mono">
            +${netSavings}
          </div>
          <div className="text-[11px] text-emerald-400/90 font-mono mt-2">
            97.9% Savings vs traditional token billing
          </div>
        </div>

      </div>

      {/* Dual Charts Row: Throughput Timeline & Model Routing Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Operation Throughput Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                ENTERPRISE OPERATION THROUGHPUT & TIER SPLIT
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Local GPU & Deterministic Code vs Escalated Cloud API calls
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Local/Code Ops ($0)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Cloud API ($)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="colorLocal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="localOps" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorLocal)" />
                <Area type="monotone" dataKey="cloudOps" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCloud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Tier Routing Pie Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              MODEL INVOCATION DISTRIBUTION
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Enforcing the &quot;LLM as scarce resource&quot; rule
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelTierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {modelTierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {modelTierData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[170px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </span>
                <strong className="text-white">{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* GPU Server Telemetry & Department Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* On-Premises Inference Host Monitor (RTX 5070 Ti) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>INFERENCE HOST (RTX 5070 Ti 12GB)</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              HEALTHY
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>VRAM ALLOCATION (Qwen3 8B AWQ)</span>
                <span className="text-white font-bold">6.8 GB / 12 GB (56%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[56%] h-full bg-cyan-400 rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>GPU COMPUTE UTILIZATION</span>
                <span className="text-white font-bold">42% (Batch Size 8)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[42%] h-full bg-emerald-400 rounded-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div className="p-2.5 rounded bg-slate-950">
                <span className="text-slate-500 block text-[10px]">CORE TEMP</span>
                <span className="text-white font-bold">54°C (Fan 38%)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950">
                <span className="text-slate-500 block text-[10px]">INFERENCE LATENCY</span>
                <span className="text-cyan-300 font-bold">82 t/s (~140ms)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Volume and Cost Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              DEPARTMENTAL RESOLUTION VOLUME & COST
            </h3>
            <span className="text-xs text-slate-400 font-mono">8 Operational Divisions</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptCostData}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="tasks" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
