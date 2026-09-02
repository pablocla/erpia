export type AgentStatus = 
  | 'ONLINE' 
  | 'IDLE' 
  | 'THINKING' 
  | 'EXECUTING' 
  | 'WAITING' 
  | 'BLOCKED' 
  | 'ERROR' 
  | 'ESCALATED' 
  | 'OFFLINE';

export type ModelTier = 
  | 'RULE_ENGINE' 
  | 'LOCAL_QWEN_3B' 
  | 'LOCAL_QWEN_8B' 
  | 'CHEAP_API_NANO' 
  | 'PREMIUM_API_REASONING';

export type DepartmentId = 
  | 'SALES' 
  | 'CUSTOMER_SERVICE' 
  | 'BILLING' 
  | 'ACCOUNTING' 
  | 'OPERATIONS' 
  | 'FUNCTIONAL_SUPPORT' 
  | 'INFRASTRUCTURE' 
  | 'FINANCE';

export interface AgentMemory {
  shortTerm: {
    currentContext: string;
    activeSessionId?: string;
    lastVariables: Record<string, string | number | boolean>;
  };
  longTerm: {
    verifiedProceduresCount: number;
    knownErrorPatternsCount: number;
    snippets: Array<{ title: string; category: string; description: string; lastUsed: string }>;
  };
  organizationalMemory: {
    companyRulesLoaded: string[];
    erpSchemaVersion: string;
    fiscalPolicies: string[];
  };
}

export interface AgentActionTrace {
  id: string;
  timestamp: string;
  action: string;
  tool?: string;
  status: 'success' | 'running' | 'failed' | 'warning';
  payload?: string;
  result?: string;
  cost: number;
  durationMs: number;
}

export interface Agent {
  id: string;
  name: string;
  codeName: string;
  avatar: string;
  role: string;
  departmentId: DepartmentId;
  level: number;
  status: AgentStatus;
  statusMessage?: string;
  primaryModel: string;
  fallbackModel: string;
  premiumModel?: string;
  tasksToday: number;
  successRate: number;
  avgCost: number;
  totalCostToday: number;
  currentTask?: {
    id: string;
    title: string;
    startedAt: string;
    step: string;
    targetSystem: string;
    progress: number;
  };
  tools: string[];
  permissions: string[];
  skills: string[];
  memory: AgentMemory;
  recentActions: AgentActionTrace[];
  isCustom?: boolean;
  color: string;
}

export interface Department {
  id: DepartmentId;
  name: string;
  code: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
  floor: number;
  revenueToday?: number;
  ordersCount?: number;
  activeAgentsCount: number;
  totalTasksToday: number;
  successRate: number;
  avgResolutionTime: string;
  agentsCount: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  departmentId: DepartmentId;
  type: 'success' | 'investigating' | 'alert' | 'info' | 'warning' | 'error' | 'approval';
  title: string;
  details: string;
  modelTier: ModelTier;
  modelName: string;
  cost: number;
  tokens: { input: number; output: number };
  toolUsed?: string;
  targetDoc?: string;
  latencyMs: number;
}

export interface IncidentEvidence {
  id: string;
  sourceAgent: string;
  type: 'SQL' | 'API_PAYLOAD' | 'SX3_CONFIG' | 'LOG' | 'NETWORK';
  title: string;
  data: string;
  timestamp: string;
}

export interface IncidentHypothesis {
  id: string;
  hypothesis: string;
  proposedBy: string;
  confidence: number;
  status: 'CONFIRMED' | 'DISPROVEN' | 'INVESTIGATING';
  reasoning: string;
}

export interface Incident {
  id: string;
  title: string;
  departmentId: DepartmentId;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'INVESTIGATING' | 'RESOLVED' | 'MITIGATED' | 'ESCALATED';
  startedAt: string;
  orchestratorAgentId: string;
  participatingAgentIds: string[];
  currentStep: string;
  hypotheses: IncidentHypothesis[];
  evidence: IncidentEvidence[];
  rootCause?: string;
  suggestedFix?: string;
  costTotal: number;
  confidenceScore: number;
  resolutionSummary?: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  amount?: string;
  requestedByAgentId: string;
  requestedByAgentName: string;
  requestedByAvatar: string;
  departmentId: DepartmentId;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  whatIKnow: string[];
  whatIDontKnow: string[];
  whatITried: string[];
  whatFailed: string[];
  whatIRecommend: string;
  whatINeedFromYou: string;
  evidencePayload: Record<string, unknown>;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  system: 'ERP_PROTHEUS' | 'ERP_SAP' | 'ERP_ODOO' | 'SQL_DATABASE' | 'ARCA_TSS' | 'WHATSAPP' | 'EMAIL' | 'BANK_API';
  category: 'READ' | 'WRITE' | 'DIAGNOSE' | 'COMMUNICATION' | 'TRANSACTION';
  description: string;
  inputSchema: string;
  outputSchema: string;
  permissions: string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresApproval: boolean;
  costPerCall: number;
  callsToday: number;
  avgLatencyMs: number;
  isAvailable: boolean;
}

export interface ObservabilityMetrics {
  totalAgents: number;
  activeAgents: number;
  tasksToday: number;
  successRate: number;
  deterministicOps: number;
  localModelCalls: number;
  cheapApiCalls: number;
  premiumApiCalls: number;
  totalAiCost: number;
  costSavedVsPureCloud: number;
  avgCostPerTask: number;
  gpuStats: {
    gpuName: string;
    vramUsedGb: number;
    vramTotalGb: number;
    utilizationPercent: number;
    activeBatchSize: number;
    queueLength: number;
    temperatureC: number;
  };
}

export interface TenantInfo {
  id: string;
  name: string;
  plan: 'Starter' | 'Business' | 'Enterprise';
  monthlyFee: number;
  quotaTasks: number;
  currentTasksMonth: number;
  connectedErp: string;
  database: string;
}

/** Snapshot estilo Hermes3D: el backend es la verdad, la oficina solo pinta. */
export interface OfficeDeskPresence {
  departmentId: DepartmentId;
  status: AgentStatus;
  statusMessage: string;
  tasksToday: number;
  flag?: string;
}

export interface OfficeLiveEvent {
  departmentId: DepartmentId;
  type: ActivityEvent['type'];
  title: string;
  details: string;
  targetDoc?: string;
}

export interface OfficePresence {
  live: boolean;
  source: 'erp' | 'demo';
  generatedAt: string;
  tenantName?: string;
  metrics: {
    facturasHoy: number;
    facturasPendientes: number;
    ticketsAbiertos: number;
    pedidosAbiertos: number;
    cxVencidas: number;
    dbOk: boolean;
  };
  desks: OfficeDeskPresence[];
  events: OfficeLiveEvent[];
}
