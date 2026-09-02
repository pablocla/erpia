'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Agent, 
  Department, 
  ToolDefinition, 
  Incident, 
  ApprovalRequest, 
  ActivityEvent, 
  ObservabilityMetrics, 
  TenantInfo,
  DepartmentId,
  AgentStatus,
  OfficePresence
} from '@/types/agent-city';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_AGENTS, 
  INITIAL_TOOLS, 
  INITIAL_INCIDENTS, 
  INITIAL_APPROVALS, 
  INITIAL_EVENTS, 
  INITIAL_METRICS,
  DEMO_TENANTS 
} from '@/lib/agent-city/demo-data';

interface AgentCityContextType {
  tenants: TenantInfo[];
  currentTenant: TenantInfo;
  setCurrentTenant: (tenant: TenantInfo) => void;
  departments: Department[];
  agents: Agent[];
  tools: ToolDefinition[];
  incidents: Incident[];
  approvals: ApprovalRequest[];
  events: ActivityEvent[];
  metrics: ObservabilityMetrics;
  selectedAgent: Agent | null;
  selectedDepartment: Department | null;
  selectedIncident: Incident | null;
  selectedApproval: ApprovalRequest | null;
  activeTab: string;
  simulationSpeed: number; // 0 = paused, 1 = normal, 3 = fast
  isLiveFeedPaused: boolean;
  selectAgent: (agentId: string | null) => void;
  selectDepartment: (deptId: DepartmentId | null) => void;
  selectIncident: (incidentId: string | null) => void;
  selectApproval: (approvalId: string | null) => void;
  setActiveTab: (tab: string) => void;
  setSimulationSpeed: (speed: number) => void;
  setIsLiveFeedPaused: (paused: boolean) => void;
  approveRequest: (approvalId: string, note?: string) => void;
  rejectRequest: (approvalId: string, note?: string) => void;
  resolveIncident: (incidentId: string, resolution: string) => void;
  triggerCustomScenario: (scenarioType: 'invoice_error' | 'high_volume' | 'bank_sync' | 'credit_approval') => void;
  createCustomAgent: (agentData: Partial<Agent>) => void;
  executeConsoleCommand: (cmd: string) => { output: string; status: 'success' | 'error' | 'info' };
  sendAgentMessage: (agentId: string, text: string) => Promise<{ reply: string; traces: any[]; modelUsed: string }>;
  backendLive: boolean;
  backendSource: 'erp' | 'demo';
}

const AgentCityContext = createContext<AgentCityContextType | undefined>(undefined);

export function AgentCityProvider({ children }: { children: ReactNode }) {
  const [tenants] = useState<TenantInfo[]>(DEMO_TENANTS);
  const [currentTenant, setCurrentTenant] = useState<TenantInfo>(DEMO_TENANTS[0]);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [tools, setTools] = useState<ToolDefinition[]>(INITIAL_TOOLS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [events, setEvents] = useState<ActivityEvent[]>(INITIAL_EVENTS);
  const [metrics, setMetrics] = useState<ObservabilityMetrics>(INITIAL_METRICS);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<DepartmentId | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('city');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isLiveFeedPaused, setIsLiveFeedPaused] = useState<boolean>(false);
  const [backendLive, setBackendLive] = useState(false);
  const [backendSource, setBackendSource] = useState<'erp' | 'demo'>('demo');

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;
  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId) || null;
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || null;
  const selectedApproval = approvals.find(a => a.id === selectedApprovalId) || null;

  const selectAgent = useCallback((agentId: string | null) => {
    setSelectedAgentId(agentId);
  }, []);

  const selectDepartment = useCallback((deptId: DepartmentId | null) => {
    setSelectedDepartmentId(deptId);
  }, []);

  const selectIncident = useCallback((incidentId: string | null) => {
    setSelectedIncidentId(incidentId);
  }, []);

  const selectApproval = useCallback((approvalId: string | null) => {
    setSelectedApprovalId(approvalId);
  }, []);

  // Helper to format timestamp
  const getNowFormatted = () => {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Add event helper
  const addEvent = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: getNowFormatted()
    };

    setEvents(prev => [newEvent, ...prev.slice(0, 99)]);

    // Update global metrics
    setMetrics(prev => {
      const isLocal = event.modelTier === 'RULE_ENGINE' || event.modelTier.includes('LOCAL');
      return {
        ...prev,
        tasksToday: prev.tasksToday + 1,
        deterministicOps: event.modelTier === 'RULE_ENGINE' ? prev.deterministicOps + 1 : prev.deterministicOps,
        localModelCalls: event.modelTier.includes('LOCAL') ? prev.localModelCalls + 1 : prev.localModelCalls,
        cheapApiCalls: event.modelTier === 'CHEAP_API_NANO' ? prev.cheapApiCalls + 1 : prev.cheapApiCalls,
        premiumApiCalls: event.modelTier === 'PREMIUM_API_REASONING' ? prev.premiumApiCalls + 1 : prev.premiumApiCalls,
        totalAiCost: Number((prev.totalAiCost + (event.cost || 0)).toFixed(4)),
        costSavedVsPureCloud: Number((prev.costSavedVsPureCloud + (isLocal ? 0.045 : 0)).toFixed(2))
      };
    });
  }, []);

  // Approval actions
  const approveRequest = useCallback((approvalId: string, note?: string) => {
    setApprovals(prev => prev.map(app => {
      if (app.id === approvalId) {
        return {
          ...app,
          status: 'APPROVED',
          resolvedAt: getNowFormatted(),
          resolutionNote: note || 'Approved by System Administrator'
        };
      }
      return app;
    }));

    const target = approvals.find(a => a.id === approvalId);
    if (target) {
      addEvent({
        agentId: target.requestedByAgentId,
        agentName: target.requestedByAgentName,
        agentAvatar: target.requestedByAvatar,
        departmentId: target.departmentId,
        type: 'success',
        title: `Approval Granted: ${target.title}`,
        details: `Human administrator approved operation. Execution unlocked on ERP. Note: ${note || 'Proceed with authorization'}`,
        modelTier: 'RULE_ENGINE',
        modelName: 'Human-in-the-Loop Signoff',
        cost: 0.0000,
        tokens: { input: 0, output: 0 },
        latencyMs: 45
      });

      // If it was the schema patch APP-824, resolve Incident 5821
      if (approvalId === 'APP-824') {
        setIncidents(prev => prev.map(inc => {
          if (inc.id === 'INC-5821') {
            return {
              ...inc,
              status: 'RESOLVED',
              currentStep: 'Schema hot-patch applied and SX3 cache refreshed. 4 queued invoices emitted successfully.',
              resolutionSummary: 'Executed SX3010 update for D2_TES field with default value 501. AFIP CAE received.'
            };
          }
          return inc;
        }));
      }

      // Update agent state back to ONLINE
      setAgents(prev => prev.map(ag => {
        if (ag.id === target.requestedByAgentId) {
          return {
            ...ag,
            status: 'ONLINE',
            statusMessage: 'Operation authorized and executed successfully'
          };
        }
        return ag;
      }));
    }
  }, [approvals, addEvent]);

  const rejectRequest = useCallback((approvalId: string, note?: string) => {
    setApprovals(prev => prev.map(app => {
      if (app.id === approvalId) {
        return {
          ...app,
          status: 'REJECTED',
          resolvedAt: getNowFormatted(),
          resolutionNote: note || 'Rejected by System Administrator'
        };
      }
      return app;
    }));

    const target = approvals.find(a => a.id === approvalId);
    if (target) {
      addEvent({
        agentId: target.requestedByAgentId,
        agentName: target.requestedByAgentName,
        agentAvatar: target.requestedByAvatar,
        departmentId: target.departmentId,
        type: 'warning',
        title: `Approval Rejected: ${target.title}`,
        details: `Human administrator rejected the request. Operation safely cancelled without touching ERP ledger. Note: ${note || 'Cancelled'}`,
        modelTier: 'RULE_ENGINE',
        modelName: 'Policy Safety Guard',
        cost: 0.0000,
        tokens: { input: 0, output: 0 },
        latencyMs: 30
      });
    }
  }, [approvals, addEvent]);

  const resolveIncident = useCallback((incidentId: string, resolution: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'RESOLVED',
          resolutionSummary: resolution,
          currentStep: 'Incident closed and archived to organizational memory.'
        };
      }
      return inc;
    }));

    addEvent({
      agentId: 'agent-functional-01',
      agentName: 'Functional Support Specialist',
      agentAvatar: '🔬',
      departmentId: 'FUNCTIONAL_SUPPORT',
      type: 'success',
      title: `Incident ${incidentId} Resolved`,
      details: `Resolution verified across ERP and DB. Summary: ${resolution}`,
      modelTier: 'LOCAL_QWEN_8B',
      modelName: 'Qwen3 8B AWQ',
      cost: 0.0000,
      tokens: { input: 410, output: 95 },
      latencyMs: 140
    });
  }, [addEvent]);

  // Trigger custom scenario
  const triggerCustomScenario = useCallback((scenarioType: 'invoice_error' | 'high_volume' | 'bank_sync' | 'credit_approval') => {
    if (scenarioType === 'invoice_error') {
      const invNumber = Math.floor(18400 + Math.random() * 900);
      addEvent({
        agentId: 'agent-billing-01',
        agentName: 'Billing Agent Alpha',
        agentAvatar: '🤖',
        departmentId: 'BILLING',
        type: 'error',
        title: `Invoice #${invNumber} Rejected by ARCA`,
        details: `Transmission failed: D2_TES value missing for customer CUST-${Math.floor(100 + Math.random() * 900)}. Routing to Functional Agent.`,
        modelTier: 'RULE_ENGINE',
        modelName: 'TSS Gateway Error Handler',
        cost: 0.0000,
        tokens: { input: 0, output: 0 },
        toolUsed: 'ARCA TSS Gateway',
        targetDoc: `INV-${invNumber}`,
        latencyMs: 340
      });

      // Change Billing Agent status to EXECUTING
      setAgents(prev => prev.map(a => {
        if (a.id === 'agent-billing-01') return { ...a, status: 'EXECUTING', statusMessage: `Diagnosing Invoice #${invNumber}` }
        if (a.id === 'agent-functional-01') return { ...a, status: 'ESCALATED', statusMessage: `TES null on INV-${invNumber}` }
        return a
      }));
      
      setTimeout(() => {
        addEvent({
          agentId: 'agent-functional-01',
          agentName: 'Functional Support Specialist',
          agentAvatar: '🔬',
          departmentId: 'FUNCTIONAL_SUPPORT',
          type: 'investigating',
          title: `Investigating Invoice #${invNumber} Error`,
          details: 'Inspecting SX3 dictionary and applying fallback TES rule #501 from local verified procedure.',
          modelTier: 'LOCAL_QWEN_8B',
          modelName: 'Qwen3 8B AWQ (Local GPU)',
          cost: 0.0000,
          tokens: { input: 512, output: 120 },
          toolUsed: 'SQL DB Connector',
          latencyMs: 280
        });
      }, 1200);

    } else if (scenarioType === 'bank_sync') {
      const batchNum = Math.floor(1000 + Math.random() * 500);
      addEvent({
        agentId: 'agent-accounting-01',
        agentName: 'Accounting Conciliator',
        agentAvatar: '📊',
        departmentId: 'ACCOUNTING',
        type: 'info',
        title: `Started OFX Bank Reconciliation Batch #${batchNum}`,
        details: 'Fetched 86 new wire transfers from Santander Open Banking API. Reconciling with SE1 ledger.',
        modelTier: 'RULE_ENGINE',
        modelName: 'Deterministic Hash Matcher',
        cost: 0.0000,
        tokens: { input: 0, output: 0 },
        toolUsed: 'Bank OFX Parser',
        latencyMs: 420
      });

      setTimeout(() => {
        addEvent({
          agentId: 'agent-accounting-01',
          agentName: 'Accounting Conciliator',
          agentAvatar: '📊',
          departmentId: 'ACCOUNTING',
          type: 'success',
          title: `Batch #${batchNum} 100% Reconciled`,
          details: '86 receipts matched with $0.00 variance. Balancing journal entry posted in Protheus CT2.',
          modelTier: 'RULE_ENGINE',
          modelName: 'Deterministic Hash Matcher',
          cost: 0.0000,
          tokens: { input: 0, output: 0 },
          toolUsed: 'Protheus Accounting Journal',
          latencyMs: 180
        });
      }, 1500);

    } else if (scenarioType === 'credit_approval') {
      const newAppId = `APP-${Math.floor(900 + Math.random() * 100)}`;
      const amountVal = `$${(Math.floor(200 + Math.random() * 800) * 1000).toLocaleString('en-US')}.00 ARS`;
      const newApproval: ApprovalRequest = {
        id: newAppId,
        title: `Authorize Commercial Credit Expansion (${amountVal})`,
        amount: amountVal,
        requestedByAgentId: 'agent-finance-01',
        requestedByAgentName: 'Credit Risk Evaluator',
        requestedByAvatar: '⚖️',
        departmentId: 'FINANCE',
        reason: 'Customer requested 60-day payment term extension for large harvest equipment purchase',
        riskLevel: 'MEDIUM',
        status: 'PENDING',
        createdAt: getNowFormatted(),
        whatIKnow: [
          'Client has maintained 100% on-time payment track record over the last 18 months',
          'Current credit line is $1,200,000 ARS with $0 overdue balance',
          'Bank credit rating verified as Grade A with Central Bank BCRA database'
        ],
        whatIDontKnow: [
          'If the company has seasonal collateral posted for the Q4 harvest cycle'
        ],
        whatITried: [
          'Ran credit score model in Qwen 8B (Score: 88/100, Very Low Risk)',
          'Simulated ledger cash flow impact under 60-day delayed settlement'
        ],
        whatFailed: [
          'Autonomous policy FIN-03 blocked expansion (Terms > 30 days mandate VP sign-off)'
        ],
        whatIRecommend: 'Approve credit line expansion to $2,000,000 ARS with standard 1.5% interest on day 45+.',
        whatINeedFromYou: 'Authorization to adjust the credit ceiling field A1_LC in SA1 table.',
        evidencePayload: {
          customer: 'Agropecuaria del Litoral SA',
          score: 88,
          proposed_ceiling: amountVal
        }
      };

      setApprovals(prev => [newApproval, ...prev]);
      setAgents(prev => prev.map(a =>
        a.id === 'agent-finance-01'
          ? { ...a, status: 'WAITING', statusMessage: `Firma humana ${newAppId}` }
          : a
      ));
      addEvent({
        agentId: 'agent-finance-01',
        agentName: 'Credit Risk Evaluator',
        agentAvatar: '⚖️',
        departmentId: 'FINANCE',
        type: 'approval',
        title: `Approval Required: ${newAppId}`,
        details: `Credit expansion of ${amountVal} requires human sign-off per policy FIN-03.`,
        modelTier: 'LOCAL_QWEN_8B',
        modelName: 'Qwen3 8B AWQ',
        cost: 0.0000,
        tokens: { input: 390, output: 95 },
        toolUsed: 'Policy Engine',
        targetDoc: newAppId,
        latencyMs: 190
      });
    } else if (scenarioType === 'high_volume') {
      // Simulate high volume burst
      const numBatches = 5;
      for (let i = 0; i < numBatches; i++) {
        setTimeout(() => {
          const invNum = Math.floor(18420 + Math.random() * 50);
          addEvent({
            agentId: 'agent-billing-01',
            agentName: 'Billing Agent Alpha',
            agentAvatar: '🤖',
            departmentId: 'BILLING',
            type: 'success',
            title: `Batch Invoice #${invNum} Transmitted`,
            details: `CAE authorized by ARCA. Sent to customer email. Cost: $0.00 (Local Rule Engine).`,
            modelTier: 'RULE_ENGINE',
            modelName: 'Deterministic Engine',
            cost: 0.0000,
            tokens: { input: 0, output: 0 },
            toolUsed: 'ARCA TSS Gateway',
            latencyMs: 140
          });
        }, i * 350);
      }
    }
  }, [addEvent]);

  // Create Custom Agent
  const createCustomAgent = useCallback((agentData: Partial<Agent>) => {
    const newAgent: Agent = {
      id: `agent-custom-${Date.now()}`,
      name: agentData.name || 'Custom Specialist',
      codeName: agentData.codeName || `AGENT-${Math.floor(100 + Math.random() * 900)}`,
      avatar: agentData.avatar || '⚡',
      role: agentData.role || 'Process Specialist',
      departmentId: agentData.departmentId || 'OPERATIONS',
      level: 1,
      status: 'ONLINE',
      statusMessage: 'Initialized and waiting for events',
      primaryModel: agentData.primaryModel || 'Qwen3 8B AWQ (Local GPU)',
      fallbackModel: agentData.fallbackModel || 'GPT-5.4 Nano ($0.20/M)',
      premiumModel: 'Gemini 3.5 Pro',
      tasksToday: 0,
      successRate: 100,
      avgCost: 0.0000,
      totalCostToday: 0.0000,
      tools: agentData.tools || ['SQL DB Connector', 'Protheus API'],
      permissions: agentData.permissions || ['General:read'],
      skills: agentData.skills || ['Automation', 'Monitoring'],
      memory: {
        shortTerm: { currentContext: 'Newly hired agent ready for dispatch', lastVariables: {} },
        longTerm: { verifiedProceduresCount: 5, knownErrorPatternsCount: 0, snippets: [] },
        organizationalMemory: { companyRulesLoaded: ['Standard compliance'], erpSchemaVersion: '12.1.2410', fiscalPolicies: [] }
      },
      recentActions: [],
      isCustom: true,
      color: '#38bdf8'
    };

    setAgents(prev => [...prev, newAgent]);

    // Update department count
    setDepartments(prev => prev.map(d => d.id === newAgent.departmentId ? { ...d, agentsCount: d.agentsCount + 1, activeAgentsCount: d.activeAgentsCount + 1 } : d));

    addEvent({
      agentId: newAgent.id,
      agentName: newAgent.name,
      agentAvatar: newAgent.avatar,
      departmentId: newAgent.departmentId,
      type: 'info',
      title: `Agent Deployed: ${newAgent.name}`,
      details: `Hired to ${newAgent.departmentId} department. Connected to local GPU model Qwen3 8B.`,
      modelTier: 'LOCAL_QWEN_8B',
      modelName: 'Qwen3 8B AWQ',
      cost: 0.0000,
      tokens: { input: 120, output: 40 },
      latencyMs: 120
    });
  }, [addEvent]);

  // Terminal Console command executor
  const executeConsoleCommand = useCallback((cmd: string): { output: string; status: 'success' | 'error' | 'info' } => {
    const trimmed = cmd.trim();
    const parts = trimmed.split(' ');
    const command = parts[0]?.toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (!command) {
      return { output: '', status: 'info' };
    }

    if (command === 'help') {
      return {
        output: `Available Agent City CLI Commands:
  inspect <invoice_id|agent_id|table>   - Inspect live state and database records
  diagnose <incident_id|issue>          - Run root-cause diagnostic suite
  trace <task_id>                       - Show execution timeline and tool calls
  status                                - View system health, GPU & AppServer metrics
  memory <agent_id>                     - Inspect short-term & organizational memory
  tools                                 - List all registered tools and permissions
  cost                                  - View local-first economics and token savings
  simulate <scenario>                   - Run simulated scenario (invoice_error, bank_sync, credit_approval)
  top                                   - Show real-time agent CPU/GPU/Task activity
  clear                                 - Clear console screen`,
        status: 'info'
      };
    }

    if (command === 'status') {
      return {
        output: `AGENT CITY OS — STATUS REPORT
────────────────────────────────────────
Tenant:             ${currentTenant.name} (${currentTenant.plan})
Total Agents:       ${agents.length} (${agents.filter(a => a.status !== 'OFFLINE').length} Online/Active)
Tasks Today:        ${metrics.tasksToday.toLocaleString()}
Success Rate:       ${metrics.successRate}%
Local vs API Ratio: 99.1% Local (Token cost: $0.00)
AI Cost Today:      $${metrics.totalAiCost} (Saved $${metrics.costSavedVsPureCloud} vs cloud-only)

INFRASTRUCTURE:
  GPU Pool:         RTX 5070 Ti 12GB [VRAM: ${metrics.gpuStats.vramUsedGb}GB / 12GB] Temp: ${metrics.gpuStats.temperatureC}°C
  AppServer:        TOTVS Protheus 12.1.2410 (8 threads nominal, 14ms avg ping)
  PostgreSQL:       pgvector + DB connected (42 conn, 0 locks)`,
        status: 'success'
      };
    }

    if (command === 'inspect') {
      if (!arg) {
        return { output: 'Usage: inspect <invoice_id | agent_id | table_name> (e.g. inspect invoice 18392)', status: 'error' };
      }
      if (arg.includes('18392') || arg.includes('invoice')) {
        return {
          output: `INSPECTION RESULT: INVOICE #18392
────────────────────────────────────────
Document ID:     INV-18392
Type:            Factura A (Electronic)
Customer:        CUST-984 (Distribuidora Central SA)
CUIT:            30-71289192-4 (Inscripto Activo)
Amount:          $342,190.00 ARS
Status:          QUEUED_TRANSMISSION_RETRY

DIAGNOSIS:
  Field D2_TES:  NULL (Rejected by TSS Gateway)
  SX3 Table:     SD2010 (Items de Factura)
  Related Patch: #APP-824 (Pending Human Approval)
  Recommendation: Approve #APP-824 in Approval Center to unblock.`,
          status: 'success'
        };
      }
      const foundAgent = agents.find(a => a.id.toLowerCase().includes(arg.toLowerCase()) || a.name.toLowerCase().includes(arg.toLowerCase()));
      if (foundAgent) {
        return {
          output: `AGENT PROFILE: ${foundAgent.name} (${foundAgent.codeName})
────────────────────────────────────────
Department:      ${foundAgent.departmentId}
Status:          ${foundAgent.status} (${foundAgent.statusMessage})
Primary Model:   ${foundAgent.primaryModel}
Fallback Model:  ${foundAgent.fallbackModel}
Tasks Today:     ${foundAgent.tasksToday}
Success Rate:    ${foundAgent.successRate}%
Avg Cost:        $${foundAgent.avgCost}
Tools:           ${foundAgent.tools.join(', ')}
Permissions:     ${foundAgent.permissions.join(', ')}`,
          status: 'success'
        };
      }
      return { output: `Queried entity "${arg}": Record found in PostgreSQL buffer. 12 fields indexed.`, status: 'info' };
    }

    if (command === 'diagnose') {
      return {
        output: `DIAGNOSTIC SUITE RUN FOR: ${arg || 'INC-5821'}
────────────────────────────────────────
[14:32:01] ⚡ Checking network connectivity to TSS/ARCA ... OK (140ms)
[14:32:02] ⚡ Verifying SA1 Customer Tax Status ... OK (CUIT Active)
[14:32:03] ⚡ Inspecting SX3 Dictionary Table SD2010 ... MISMATCH DETECTED
           -> Field D2_TES missing default formula X3_RELACAO
[14:32:04] ⚡ Checking AppServer thread locks ... 0 locks
ROOT CAUSE: SX3 Dictionary field D2_TES requires default relation "501" for movement type M02.
CONFIDENCE SCORE: 94%`,
        status: 'success'
      };
    }

    if (command === 'trace') {
      return {
        output: `TASK EXECUTION TRACE: ${arg || 'TASK-INV-18392'}
────────────────────────────────────────
T+000ms  [EVENT_BUS]     Received event "invoice_ready_for_transmission"
T+012ms  [ROUTER]        Evaluated Rule Engine (No cloud tokens used) -> Dispatched to Billing Agent
T+045ms  [PROTHEUS_API]  GET /api/v1/invoices/18392 -> Returned 200 OK (8 items)
T+180ms  [TSS_GATEWAY]   POST /ws/transmission -> Returned 400 (D2_TES null)
T+210ms  [LOCAL_QWEN8B]  Synthesized diagnosis & triggered Functional Agent
T+320ms  [APPROVAL_SYS]  Generated Patch Approval #APP-824`,
        status: 'info'
      };
    }

    if (command === 'tools') {
      return {
        output: `REGISTERED ENTERPRISE TOOLS (${tools.length})
────────────────────────────────────────────────────
${tools.map(t => `• [${t.system}] ${t.name.padEnd(32)} Risk: ${t.risk.padEnd(6)} Approval: ${t.requiresApproval ? 'YES' : 'NO'}`).join('\n')}`,
        status: 'info'
      };
    }

    if (command === 'cost') {
      return {
        output: `LOCAL-FIRST AI COST ENGINE BREAKDOWN
────────────────────────────────────────
Deterministic Rule Ops:  ${metrics.deterministicOps.toLocaleString()} ($0.00 / 91.1%)
Local Qwen 8B GPU:       ${metrics.localModelCalls.toLocaleString()} ($0.00 / 8.0%)
Cheap API (GPT-5.4 Nano):${metrics.cheapApiCalls.toLocaleString()} ($0.20/M in, $1.25/M out)
Premium API (Reasoning): ${metrics.premiumApiCalls} ($${(metrics.premiumApiCalls * 0.015).toFixed(2)})
────────────────────────────────────────
Total AI Cost Today:     $${metrics.totalAiCost}
Net Cost Saved vs Cloud: $${metrics.costSavedVsPureCloud}
Average Cost per Task:   $${metrics.avgCostPerTask}`,
        status: 'success'
      };
    }

    if (command === 'simulate') {
      if (arg === 'invoice_error' || arg === 'bank_sync' || arg === 'credit_approval' || arg === 'high_volume') {
        triggerCustomScenario(arg);
        return { output: `Triggered simulation scenario: "${arg}". Watch the live city map and event feed.`, status: 'success' };
      }
      return { output: `Usage: simulate <invoice_error | bank_sync | credit_approval | high_volume>`, status: 'error' };
    }

    return { output: `Command not recognized: "${cmd}". Type "help" for a list of commands.`, status: 'error' };
  }, [currentTenant, agents, metrics, tools, triggerCustomScenario]);

  // Send message to agent
  const sendAgentMessage = useCallback(async (agentId: string, text: string) => {
    const targetAgent = agents.find(a => a.id === agentId);
    try {
      const res = await fetch('/api/agent-city/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          agentRole: targetAgent?.role,
          agentDepartment: targetAgent?.departmentId,
          userMessage: text,
          context: {
            tasksToday: targetAgent?.tasksToday,
            currentTask: targetAgent?.currentTask,
            memory: targetAgent?.memory
          }
        })
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('API error, using local fallback:', e);
      return {
        reply: `He procesado tu consulta localmente en el modelo Qwen3 8B AWQ. Todos los parámetros operativos están alineados con las políticas de ${targetAgent?.departmentId || 'la empresa'}.`,
        traces: [
          { timestamp: getNowFormatted(), tool: 'Local Qwen Ingest', action: `Processed request "${text.slice(0, 25)}..."`, status: 'success', durationMs: 45, cost: 0.0000 }
        ],
        modelUsed: 'Qwen3 8B AWQ (Local GPU)'
      };
    }
  }, [agents]);

  // Hermes3D-style: backend is source of truth; office only paints presence.
  useEffect(() => {
    let cancelled = false
    const pull = async () => {
      try {
        const res = await fetch('/api/agent-city/presence', { cache: 'no-store' })
        if (!res.ok) return
        const presence: OfficePresence = await res.json()
        if (cancelled) return
        setBackendLive(presence.live)
        setBackendSource(presence.source)
        if (!presence.live || presence.desks.length === 0) return

        setAgents((prev) =>
          prev.map((ag) => {
            const desk = presence.desks.find((d) => d.departmentId === ag.departmentId)
            if (!desk) return ag
            return {
              ...ag,
              status: desk.status,
              statusMessage: desk.statusMessage,
              tasksToday: Math.max(ag.tasksToday, desk.tasksToday),
            }
          }),
        )

        setMetrics((prev) => ({
          ...prev,
          tasksToday: Math.max(
            prev.tasksToday,
            presence.metrics.facturasHoy + presence.metrics.ticketsAbiertos + presence.metrics.pedidosAbiertos,
          ),
          activeAgents: Math.max(1, presence.desks.filter((d) => d.status !== 'ONLINE' && d.status !== 'IDLE' && d.status !== 'OFFLINE').length),
        }))

        if (presence.tenantName) {
          setCurrentTenant((t) => ({ ...t, name: presence.tenantName || t.name, connectedErp: 'Claver ERP (live presence)' }))
        }

        setEvents((prev) => {
          const deskAgent: Record<string, string> = {
            BILLING: 'agent-billing-01',
            FUNCTIONAL_SUPPORT: 'agent-functional-01',
            CUSTOMER_SERVICE: 'agent-customer-01',
            ACCOUNTING: 'agent-accounting-01',
            SALES: 'agent-sales-01',
            INFRASTRUCTURE: 'agent-infra-01',
            FINANCE: 'agent-finance-01',
            OPERATIONS: 'agent-operations-01',
          }
          const incoming = presence.events.map((ev, i) => ({
              id: `erp-${ev.targetDoc || ev.title}-${i}`,
              timestamp: new Date(presence.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              agentId: deskAgent[ev.departmentId] || 'agent-billing-01',
              agentName: ev.departmentId,
              agentAvatar: '📡',
              departmentId: ev.departmentId,
              type: ev.type,
              title: ev.title,
              details: ev.details,
              modelTier: 'RULE_ENGINE' as const,
              modelName: 'Claver ERP',
              cost: 0,
              tokens: { input: 0, output: 0 },
              targetDoc: ev.targetDoc,
              latencyMs: 12,
            }))
          const seen = new Set(prev.map((e) => e.title))
          const fresh = incoming.filter((e) => !seen.has(e.title))
          return [...fresh, ...prev].slice(0, 80)
        })
      } catch {
        if (!cancelled) {
          setBackendLive(false)
          setBackendSource('demo')
        }
      }
    }
    pull()
    const id = window.setInterval(pull, 8000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  // Live simulation background loop (off when ERP presence is driving the floor)
  useEffect(() => {
    if (backendLive) return
    if (simulationSpeed === 0 || isLiveFeedPaused) return;

    const intervalMs = Math.max(1200, Math.floor(3200 / simulationSpeed));

    const interval = setInterval(() => {
      // Pick random agent to cycle activity
      const randomIdx = Math.floor(Math.random() * agents.length);
      const agent = agents[randomIdx];
      if (!agent) return;

      const scenarios = [
        {
          dept: 'BILLING',
          title: `Invoice #${Math.floor(18395 + Math.random() * 50)} Emitted`,
          details: 'Verified TES 501. CAE received from ARCA in 210ms. Email sent to customer.',
          tier: 'RULE_ENGINE' as const,
          model: 'Local Deterministic Rules',
          tool: 'ARCA TSS Gateway',
          doc: `INV-${Math.floor(18395 + Math.random() * 50)}`,
          cost: 0.0000
        },
        {
          dept: 'CUSTOMER_SERVICE',
          title: 'WhatsApp Inquiry Resolved',
          details: 'Provided shipment tracking link for Order #SC-' + Math.floor(4000 + Math.random() * 1000),
          tier: 'LOCAL_QWEN_8B' as const,
          model: 'Qwen3 8B AWQ (Local GPU)',
          tool: 'WhatsApp API',
          cost: 0.0000
        },
        {
          dept: 'ACCOUNTING',
          title: 'Bank Statement Matched',
          details: 'Matched incoming wire of $42,500 ARS from BBVA with Invoice #17912. Ledger updated.',
          tier: 'RULE_ENGINE' as const,
          model: 'Deterministic Hash Matcher',
          tool: 'Protheus Accounting Journal',
          cost: 0.0000
        },
        {
          dept: 'SALES',
          title: 'Commercial Margin Validated',
          details: 'Approved 4% discount for wholesale quote. Minimum margin threshold (18%) maintained.',
          tier: 'LOCAL_QWEN_8B' as const,
          model: 'Qwen3 8B AWQ (Local GPU)',
          tool: 'Protheus Pricing Engine',
          cost: 0.0000
        },
        {
          dept: 'INFRASTRUCTURE',
          title: 'AppServer Health Check Passed',
          details: '8 worker threads active, 0 lock contention in pg_stat_activity. Latency: 12ms.',
          tier: 'RULE_ENGINE' as const,
          model: 'AppServer Poller',
          tool: 'AppServer Inspector',
          cost: 0.0000
        },
        {
          dept: 'OPERATIONS',
          title: 'Waybill & Packing Slip Generated',
          details: 'Batched 12 pick items for warehouse sector B. Dispatched carrier webhook.',
          tier: 'RULE_ENGINE' as const,
          model: 'Deterministic Engine',
          tool: 'Carrier Shipping API',
          cost: 0.0000
        }
      ];

      const chosen = scenarios[Math.floor(Math.random() * scenarios.length)];
      const matchAgent = agents.find(a => a.departmentId === chosen.dept) || agent;

      // Animate agent status briefly
      setAgents(prev => prev.map(a => {
        if (a.id === matchAgent.id) {
          const nextStatus: AgentStatus = Math.random() > 0.4 ? 'EXECUTING' : 'THINKING';
          return {
            ...a,
            status: nextStatus,
            tasksToday: a.tasksToday + 1,
            statusMessage: chosen.title
          };
        }
        return a;
      }));

      // After brief delay, return agent to ONLINE
      setTimeout(() => {
        setAgents(prev => prev.map(a => {
          if (a.id === matchAgent.id && (a.status === 'EXECUTING' || a.status === 'THINKING')) {
            return {
              ...a,
              status: 'ONLINE',
              statusMessage: 'Ready for events'
            };
          }
          return a;
        }));
      }, 1400);

      addEvent({
        agentId: matchAgent.id,
        agentName: matchAgent.name,
        agentAvatar: matchAgent.avatar,
        departmentId: matchAgent.departmentId,
        type: 'success',
        title: chosen.title,
        details: chosen.details,
        modelTier: chosen.tier,
        modelName: chosen.model,
        cost: chosen.cost,
        tokens: { input: chosen.tier === 'RULE_ENGINE' ? 0 : 320, output: chosen.tier === 'RULE_ENGINE' ? 0 : 80 },
        toolUsed: chosen.tool,
        targetDoc: chosen.doc,
        latencyMs: Math.floor(80 + Math.random() * 250)
      });

    }, intervalMs);

    return () => clearInterval(interval);
  }, [backendLive, simulationSpeed, isLiveFeedPaused, agents, addEvent]);

  return (
    <AgentCityContext.Provider
      value={{
        tenants,
        currentTenant,
        setCurrentTenant,
        departments,
        agents,
        tools,
        incidents,
        approvals,
        events,
        metrics,
        selectedAgent,
        selectedDepartment,
        selectedIncident,
        selectedApproval,
        activeTab,
        simulationSpeed,
        isLiveFeedPaused,
        selectAgent,
        selectDepartment,
        selectIncident,
        selectApproval,
        setActiveTab,
        setSimulationSpeed,
        setIsLiveFeedPaused,
        approveRequest,
        rejectRequest,
        resolveIncident,
        triggerCustomScenario,
        createCustomAgent,
        executeConsoleCommand,
        sendAgentMessage,
        backendLive,
        backendSource,
      }}
    >
      {children}
    </AgentCityContext.Provider>
  );
}

export function useAgentCity() {
  const context = useContext(AgentCityContext);
  if (!context) {
    throw new Error('useAgentCity must be used within an AgentCityProvider');
  }
  return context;
}
