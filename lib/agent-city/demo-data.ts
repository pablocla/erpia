import { 
  Department, 
  Agent, 
  ToolDefinition, 
  Incident, 
  ApprovalRequest, 
  ActivityEvent,
  TenantInfo,
  ObservabilityMetrics
} from '@/types/agent-city';

export const DEMO_TENANTS: TenantInfo[] = [
  {
    id: 'acme-prod',
    name: 'ACME Industries Corp',
    plan: 'Enterprise',
    monthlyFee: 1500,
    quotaTasks: 100000,
    currentTasksMonth: 64230,
    connectedErp: 'TOTVS Protheus 12.1.2410 + SAP Bridge',
    database: 'PostgreSQL 16.2 (Dedicated + pgvector)',
  },
  {
    id: 'globex-logistics',
    name: 'Globex Supply Chain',
    plan: 'Business',
    monthlyFee: 499,
    quotaTasks: 25000,
    currentTasksMonth: 18450,
    connectedErp: 'SAP S/4HANA Cloud',
    database: 'PostgreSQL Cloud SQL',
  },
  {
    id: 'initech-software',
    name: 'Initech Systems',
    plan: 'Starter',
    monthlyFee: 199,
    quotaTasks: 5000,
    currentTasksMonth: 3200,
    connectedErp: 'Odoo v17 Community',
    database: 'Internal DB',
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'BILLING',
    name: 'Billing & Invoicing',
    code: 'BILL',
    tagline: 'Autonomous Electronic Invoicing & Fiscal Integrity',
    description: 'Handles electronic invoice emission, tax validation (TES), ARCA/TSS transmission, and automated error recovery.',
    icon: 'ReceiptText',
    color: '#06b6d4', // Cyan
    accentColor: 'rgba(6, 182, 212, 0.2)',
    floor: 3,
    revenueToday: 142850,
    ordersCount: 412,
    activeAgentsCount: 4,
    totalTasksToday: 1284,
    successRate: 98.7,
    avgResolutionTime: '1.4s',
    agentsCount: 5,
  },
  {
    id: 'FUNCTIONAL_SUPPORT',
    name: 'Functional ERP Support',
    code: 'FUNC',
    tagline: 'Deep ERP Investigation & Root Cause Engine',
    description: 'Investigates dictionary mismatches (SX3/SIX), lockings, schema defects, and proposes verified configuration patches.',
    icon: 'Cpu',
    color: '#3b82f6', // Blue
    accentColor: 'rgba(59, 130, 246, 0.2)',
    floor: 4,
    activeAgentsCount: 3,
    totalTasksToday: 890,
    successRate: 99.1,
    avgResolutionTime: '2.8s',
    agentsCount: 4,
  },
  {
    id: 'ACCOUNTING',
    name: 'Accounting & Conciliation',
    code: 'ACCT',
    tagline: 'Automated Bank Reconciliation & Ledger Ledgering',
    description: 'Extracts bank statements (OFX/API), matches ERP ledger entries, detects variance, and drafts balancing journal entries.',
    icon: 'Scale',
    color: '#10b981', // Emerald
    accentColor: 'rgba(16, 185, 129, 0.2)',
    floor: 2,
    revenueToday: 0,
    ordersCount: 0,
    activeAgentsCount: 4,
    totalTasksToday: 980,
    successRate: 99.4,
    avgResolutionTime: '1.1s',
    agentsCount: 4,
  },
  {
    id: 'CUSTOMER_SERVICE',
    name: 'Customer Operations',
    code: 'CUST',
    tagline: '24/7 Omnichannel ERP Customer Support',
    description: 'Interacts with customers on WhatsApp and Email, fetches order status from ERP, answers billing questions, and logs tickets.',
    icon: 'MessageSquare',
    color: '#8b5cf6', // Violet
    accentColor: 'rgba(139, 92, 246, 0.2)',
    floor: 1,
    ordersCount: 650,
    activeAgentsCount: 5,
    totalTasksToday: 3410,
    successRate: 97.9,
    avgResolutionTime: '0.8s',
    agentsCount: 6,
  },
  {
    id: 'SALES',
    name: 'Sales & Commercial HQ',
    code: 'SALE',
    tagline: 'Real-time Quote Generation & Inventory Allocation',
    description: 'Validates commercial discounts, checks stock across warehouses, approves payment terms, and posts sales orders.',
    icon: 'TrendingUp',
    color: '#f59e0b', // Amber
    accentColor: 'rgba(245, 158, 11, 0.2)',
    floor: 3,
    revenueToday: 218900,
    ordersCount: 320,
    activeAgentsCount: 3,
    totalTasksToday: 1450,
    successRate: 98.4,
    avgResolutionTime: '1.9s',
    agentsCount: 4,
  },
  {
    id: 'INFRASTRUCTURE',
    name: 'Infra & Reliability',
    code: 'INFR',
    tagline: 'AppServer, DB Cluster & Microservices Health',
    description: 'Monitors Protheus AppServer threads, PostgreSQL connection pools, TSS web services, and auto-restarts stale workers.',
    icon: 'Server',
    color: '#ef4444', // Red
    accentColor: 'rgba(239, 68, 68, 0.2)',
    floor: 0,
    activeAgentsCount: 3,
    totalTasksToday: 4200,
    successRate: 99.8,
    avgResolutionTime: '0.4s',
    agentsCount: 3,
  },
  {
    id: 'OPERATIONS',
    name: 'Warehouse & Logistics',
    code: 'OPER',
    tagline: 'Pick & Pack Verification & Dispatch Routing',
    description: 'Coordinates dispatch orders, validates lot expiration dates, generates carrier labels, and updates tracking numbers.',
    icon: 'Package',
    color: '#ec4899', // Pink
    accentColor: 'rgba(236, 72, 153, 0.2)',
    floor: 1,
    ordersCount: 512,
    activeAgentsCount: 3,
    totalTasksToday: 1120,
    successRate: 99.0,
    avgResolutionTime: '1.3s',
    agentsCount: 3,
  },
  {
    id: 'FINANCE',
    name: 'Treasury & Risk Control',
    code: 'FINC',
    tagline: 'Credit Risk Scoring & High-Value Approvals',
    description: 'Evaluates customer credit limits, evaluates aging accounts receivable, detects high-risk transactions, and flags for approval.',
    icon: 'ShieldCheck',
    color: '#14b8a6', // Teal
    accentColor: 'rgba(20, 184, 166, 0.2)',
    floor: 2,
    activeAgentsCount: 3,
    totalTasksToday: 680,
    successRate: 99.6,
    avgResolutionTime: '2.1s',
    agentsCount: 3,
  }
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-billing-01',
    name: 'Billing Agent Alpha',
    codeName: 'BILLING-01',
    avatar: '🤖',
    role: 'Electronic Invoicing Specialist',
    departmentId: 'BILLING',
    level: 8,
    status: 'EXECUTING',
    statusMessage: 'Transmitting Invoice #18392 to ARCA/TSS gateway',
    primaryModel: 'Qwen3 8B AWQ (Local GPU)',
    fallbackModel: 'GPT-5.4 Nano ($0.20/M)',
    premiumModel: 'Gemini 3.5 Pro / GPT-5.4',
    tasksToday: 1284,
    successRate: 98.7,
    avgCost: 0.00007,
    totalCostToday: 0.089,
    currentTask: {
      id: 'TASK-INV-18392',
      title: 'Fiscal Transmission Invoice #18392',
      startedAt: '14:32:01',
      step: 'Verifying SX3 TES configuration & D2_TES field',
      targetSystem: 'TOTVS Protheus / ARCA TSS',
      progress: 68
    },
    tools: ['Protheus API', 'SQL DB Connector', 'ARCA TSS Gateway', 'Email Dispatcher'],
    permissions: ['Invoice:create', 'Invoice:read', 'CreditNote:create_draft', 'TES:validate'],
    skills: ['Fiscal Architecture', 'TOTVS Protheus SX3', 'Electronic Invoicing', 'Tax Reconciliation'],
    memory: {
      shortTerm: {
        currentContext: 'Investigating D2_TES null constraint for Customer CUST-984 on order SO-4421',
        lastVariables: { invoice_id: '18392', error_code: 'ERR_NULL_TES', retry_count: 1 }
      },
      longTerm: {
        verifiedProceduresCount: 42,
        knownErrorPatternsCount: 18,
        snippets: [
          { title: 'TES Auto-fallback rule for Export Customers', category: 'Fiscal', description: 'If SA1.A1_TIPO == "EX", substitute TES 501 with TES 503', lastUsed: '2026-08-29' },
          { title: 'TSS Gateway 400 Bad Request Payload Recovery', category: 'API', description: 'Re-encode UTF-8 special characters in company legal name', lastUsed: '2026-08-28' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['POL-01: Max credit note auto-approval $5,000', 'POL-04: Mandatory electronic CAI certificate validation'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['Resolution General AFIP 4291', 'RG 5003 Monotributo Invoice B']
      }
    },
    recentActions: [
      { id: 'act-1', timestamp: '14:32:01', action: 'GET /api/v1/invoices/18392', tool: 'Protheus API', status: 'success', cost: 0.0000, durationMs: 140 },
      { id: 'act-2', timestamp: '14:32:02', action: 'GET customer CUST-984 fiscal profile', tool: 'SQL DB', status: 'success', cost: 0.0000, durationMs: 45 },
      { id: 'act-3', timestamp: '14:32:03', action: 'Transmitted payload to TSS', tool: 'ARCA TSS Gateway', status: 'warning', payload: 'Payload missing D2_TES', cost: 0.0000, durationMs: 280 },
      { id: 'act-4', timestamp: '14:32:04', action: 'Query SX3 Dictionary for TES default', tool: 'SQL DB', status: 'success', cost: 0.0000, durationMs: 32 },
      { id: 'act-5', timestamp: '14:32:07', action: 'Applied local deterministic TES resolution rule #14', tool: 'Local Rule Engine', status: 'success', cost: 0.0000, durationMs: 12 }
    ],
    color: '#06b6d4'
  },
  {
    id: 'agent-functional-01',
    name: 'Functional Support Specialist',
    codeName: 'FUNCTIONAL-01',
    avatar: '🔬',
    role: 'Root Cause & Schema Diagnostician',
    departmentId: 'FUNCTIONAL_SUPPORT',
    level: 9,
    status: 'THINKING',
    statusMessage: 'Analyzing SX3 & SIX dictionary indexes for incident #5821',
    primaryModel: 'Qwen3 8B AWQ (Local GPU)',
    fallbackModel: 'GPT-5.4 Nano ($0.20/M)',
    premiumModel: 'Claude 3.7 / GPT-5.4',
    tasksToday: 890,
    successRate: 99.1,
    avgCost: 0.00012,
    totalCostToday: 0.106,
    currentTask: {
      id: 'TASK-INC-5821',
      title: 'Investigate Schema Drift on SX3 Table SD2',
      startedAt: '14:31:15',
      step: 'Running diff between Prod schema and staging template',
      targetSystem: 'Protheus SX3 Metadata DB',
      progress: 82
    },
    tools: ['SQL DB Connector', 'ERP Schema Diff', 'Log Parser', 'Knowledge RAG'],
    permissions: ['Schema:read', 'Dictionary:inspect', 'Cache:flush', 'Incident:create'],
    skills: ['TOTVS Protheus internals', 'SQL Optimization', 'Dictionary SX3/SX2', 'Code Profiling'],
    memory: {
      shortTerm: {
        currentContext: 'Incident INC-5821: D2_TES field definition lacks default value in custom module M02',
        lastVariables: { table: 'SD2', field: 'D2_TES', x3_usado: 'X', x3_context: 'R' }
      },
      longTerm: {
        verifiedProceduresCount: 88,
        knownErrorPatternsCount: 54,
        snippets: [
          { title: 'SX3 D2_TES missing index corruption fix', category: 'Database', description: 'Rebuild SIX index 4 for SD2 when multi-branch filter fails', lastUsed: '2026-08-25' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['STD-02: Never alter SX3 directly without backup dump', 'STD-09: Require human sign-off on DDL scripts'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['Standard TOTVS Customization Guidelines']
      }
    },
    recentActions: [
      { id: 'act-f1', timestamp: '14:31:20', action: 'SELECT * FROM SX3010 WHERE X3_CAMPO = "D2_TES"', tool: 'SQL DB', status: 'success', cost: 0.0000, durationMs: 18 },
      { id: 'act-f2', timestamp: '14:31:35', action: 'Vector search in local RAG for similar past incidents', tool: 'pgvector Local', status: 'success', cost: 0.0000, durationMs: 65 },
      { id: 'act-f3', timestamp: '14:31:50', action: 'Synthesized root cause hypothesis [Confidence: 94%]', tool: 'Qwen3 8B Local', status: 'success', cost: 0.0000, durationMs: 410 }
    ],
    color: '#3b82f6'
  },
  {
    id: 'agent-customer-01',
    name: 'Customer Care Agent',
    codeName: 'CUSTOMER-01',
    avatar: '💬',
    role: 'Omnichannel Order & Support Assistant',
    departmentId: 'CUSTOMER_SERVICE',
    level: 7,
    status: 'ONLINE',
    statusMessage: 'Ready for incoming WhatsApp & Web inquiries',
    primaryModel: 'Qwen3 8B AWQ (Local GPU)',
    fallbackModel: 'GPT-5.4 Nano ($0.20/M)',
    tasksToday: 3410,
    successRate: 97.9,
    avgCost: 0.00004,
    totalCostToday: 0.136,
    tools: ['WhatsApp API', 'Email Connector', 'Protheus Order Query', 'Tracking API'],
    permissions: ['Customer:read', 'Order:read_status', 'Ticket:create'],
    skills: ['Polite Multi-turn Conversation', 'Order Tracking', 'FAQ Handling', 'Sentiment Analysis'],
    memory: {
      shortTerm: {
        currentContext: 'Finished answering Client Juan Perez regarding delivery date for Order #9021',
        lastVariables: { order_id: '9021', status: 'IN_TRANSIT', carrier: 'Andreani' }
      },
      longTerm: {
        verifiedProceduresCount: 65,
        knownErrorPatternsCount: 12,
        snippets: [
          { title: 'Delivery delay apology template with $10 voucher code', category: 'Customer', description: 'Offer 5% discount when carrier is >48h delayed', lastUsed: '2026-08-28' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['CS-01: Response time < 30 seconds', 'CS-03: Escalate complaints with tone > 0.8 anger'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['Standard Consumer Protection Norms']
      }
    },
    recentActions: [
      { id: 'act-c1', timestamp: '14:32:10', action: 'Received inbound WhatsApp msg from +549114482910', tool: 'WhatsApp API', status: 'success', cost: 0.0000, durationMs: 20 },
      { id: 'act-c2', timestamp: '14:32:11', action: 'Retrieved order status from SC5 table in DB', tool: 'SQL DB', status: 'success', cost: 0.0000, durationMs: 15 },
      { id: 'act-c3', timestamp: '14:32:12', action: 'Generated empathetic Spanish response', tool: 'Qwen3 8B Local', status: 'success', cost: 0.0000, durationMs: 310 }
    ],
    color: '#8b5cf6'
  },
  {
    id: 'agent-accounting-01',
    name: 'Accounting Conciliator',
    codeName: 'ACCOUNTING-01',
    avatar: '📊',
    role: 'Bank Ledger & Statement Matcher',
    departmentId: 'ACCOUNTING',
    level: 8,
    status: 'ONLINE',
    statusMessage: 'Completed 100% bank statement reconciliation for Santander batch #981',
    primaryModel: 'Deterministic Rules + Qwen3 8B',
    fallbackModel: 'GPT-5.4 Nano',
    tasksToday: 980,
    successRate: 99.4,
    avgCost: 0.00002,
    totalCostToday: 0.020,
    tools: ['Bank OFX Parser', 'SQL DB Connector', 'Protheus Accounting Journal', 'SE2/SE1 Ledger'],
    permissions: ['Ledger:read', 'Journal:draft_entry', 'Bank:reconcile'],
    skills: ['Double-entry bookkeeping', 'Bank Reconciliation', 'Variance Detection', 'IFRS Standards'],
    memory: {
      shortTerm: {
        currentContext: 'Reconciled 142 Santander receipts against SE1 Accounts Receivable',
        lastVariables: { matched: 142, unmatched: 0, variance_usd: 0.00 }
      },
      longTerm: {
        verifiedProceduresCount: 52,
        knownErrorPatternsCount: 22,
        snippets: [
          { title: 'Tax withholding tax deduction algorithm (IIBB CABA / ARBA)', category: 'Accounting', description: 'Automatically split withholding certificate from gross wire', lastUsed: '2026-08-29' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['ACC-01: Tolerance threshold for FX rounding is $0.05', 'ACC-04: Daily closing cutoff at 18:00'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['Resolution RG 830 Withholdings']
      }
    },
    recentActions: [
      { id: 'act-a1', timestamp: '14:31:00', action: 'Fetched OFX statement file from SFTP', tool: 'Bank API', status: 'success', cost: 0.0000, durationMs: 420 },
      { id: 'act-a2', timestamp: '14:31:02', action: 'Matched 142 records via deterministic hash engine', tool: 'Rule Engine', status: 'success', cost: 0.0000, durationMs: 14 },
      { id: 'act-a3', timestamp: '14:31:05', action: 'Posted balancing entries in CT2 table', tool: 'Protheus API', status: 'success', cost: 0.0000, durationMs: 190 }
    ],
    color: '#10b981'
  },
  {
    id: 'agent-sales-01',
    name: 'Sales Quotation Agent',
    codeName: 'SALES-01',
    avatar: '📈',
    role: 'Quote Automation & Margin Validator',
    departmentId: 'SALES',
    level: 7,
    status: 'ONLINE',
    statusMessage: 'Processed quote #Q-7782 for Distribuidora Norte ($14,200)',
    primaryModel: 'Qwen3 8B AWQ (Local GPU)',
    fallbackModel: 'GPT-5.4 Nano',
    tasksToday: 1450,
    successRate: 98.4,
    avgCost: 0.00006,
    totalCostToday: 0.087,
    tools: ['Protheus Pricing Engine', 'Stock Query Tool', 'CRM Sync', 'PDF Quote Generator'],
    permissions: ['Quote:create', 'Stock:read', 'PriceTable:read'],
    skills: ['Margin Calculation', 'Volume Discounts', 'Lead Scoring', 'CRM Pipelines'],
    memory: {
      shortTerm: {
        currentContext: 'Evaluated tier 2 discount (8%) for wholesale buyer on SKU 4021',
        lastVariables: { sku: '4021', qty: 500, margin: '24.5%' }
      },
      longTerm: {
        verifiedProceduresCount: 38,
        knownErrorPatternsCount: 9,
        snippets: [
          { title: 'Volume discount table for Category A clients', category: 'Sales', description: 'Over 200 units triggers 5% additional commercial rebate', lastUsed: '2026-08-29' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['SAL-01: Minimum gross margin cannot drop below 18%', 'SAL-02: Terms > 60 days require Finance approval'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['Sales Tax Matrix Argentina']
      }
    },
    recentActions: [
      { id: 'act-s1', timestamp: '14:30:10', action: 'Calculated margin for Quote Q-7782', tool: 'Rule Engine', status: 'success', cost: 0.0000, durationMs: 8 },
      { id: 'act-s2', timestamp: '14:30:12', action: 'Verified warehouse stock in SB2 table', tool: 'SQL DB', status: 'success', cost: 0.0000, durationMs: 22 },
      { id: 'act-s3', timestamp: '14:30:15', action: 'Generated signed PDF quote', tool: 'PDF Tool', status: 'success', cost: 0.0000, durationMs: 140 }
    ],
    color: '#f59e0b'
  },
  {
    id: 'agent-infra-01',
    name: 'Infrastructure Guardian',
    codeName: 'INFRA-01',
    avatar: '🛡️',
    role: 'Protheus AppServer & DB Sentinel',
    departmentId: 'INFRASTRUCTURE',
    level: 9,
    status: 'ONLINE',
    statusMessage: 'All 8 AppServer worker threads healthy (Avg latency 14ms)',
    primaryModel: 'Deterministic Health Checks + Qwen3 3B',
    fallbackModel: 'Qwen3 8B Local',
    tasksToday: 4200,
    successRate: 99.8,
    avgCost: 0.00001,
    totalCostToday: 0.042,
    tools: ['AppServer Inspector', 'PostgreSQL pg_stat', 'Redis Queue Monitor', 'Systemd Controller'],
    permissions: ['Service:restart', 'DB:kill_idle_connections', 'Logs:tail', 'Metrics:export'],
    skills: ['Thread Pool Profiling', 'PostgreSQL Query Planner', 'OOM Prevention', 'Network Socket Health'],
    memory: {
      shortTerm: {
        currentContext: 'Verified TSS HTTPS certificate expiration (Valid for 240 days)',
        lastVariables: { tss_status: 'UP', appserver_mem: '4.2GB', redis_lag: '2ms' }
      },
      longTerm: {
        verifiedProceduresCount: 95,
        knownErrorPatternsCount: 40,
        snippets: [
          { title: 'Auto-kill locking threads on SXB/SX3 tables', category: 'Infra', description: 'Terminate backend process if exclusive lock persists > 45s', lastUsed: '2026-08-27' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['INF-01: Maximum CPU sustained load threshold 85%', 'INF-02: Auto-snapshot DB prior to restart'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['Infrastructure SLA 99.9%']
      }
    },
    recentActions: [
      { id: 'act-i1', timestamp: '14:32:00', action: 'Polled AppServer socket TCP 1234', tool: 'Health Check', status: 'success', cost: 0.0000, durationMs: 5 },
      { id: 'act-i2', timestamp: '14:32:01', action: 'Scanned for long-running locks in pg_stat_activity', tool: 'SQL DB', status: 'success', cost: 0.0000, durationMs: 12 }
    ],
    color: '#ef4444'
  },
  {
    id: 'agent-finance-01',
    name: 'Credit Risk Evaluator',
    codeName: 'FINANCE-01',
    avatar: '⚖️',
    role: 'Credit Limits & High-Risk Guard',
    departmentId: 'FINANCE',
    level: 8,
    status: 'WAITING',
    statusMessage: 'Waiting for human confirmation on Credit Note #823 ($850,000)',
    primaryModel: 'Qwen3 8B AWQ (Local GPU)',
    fallbackModel: 'GPT-5.4 Nano',
    premiumModel: 'GPT-5.4 Reasoning',
    tasksToday: 680,
    successRate: 99.6,
    avgCost: 0.00009,
    totalCostToday: 0.061,
    tools: ['Credit Scoring Engine', 'NOSIS/Veraz API', 'Protheus SE1 Query', 'Approval Dispatcher'],
    permissions: ['CreditLimit:recommend', 'CreditNote:escalate_human', 'Customer:freeze'],
    skills: ['Financial Risk Scoring', 'Bureau Integration', 'Cash-flow Projection', 'Fraud Detection'],
    memory: {
      shortTerm: {
        currentContext: 'Flagged Credit Note #823 ($850,000) for human approval due to high variance threshold',
        lastVariables: { amount: 850000, customer: 'Distribuidora Central SA', risk_score: 'MEDIUM_HIGH' }
      },
      longTerm: {
        verifiedProceduresCount: 44,
        knownErrorPatternsCount: 15,
        snippets: [
          { title: 'Credit ceiling formula by historic monthly turnover', category: 'Finance', description: 'Max credit = 1.5x average paid invoices of last 6 months', lastUsed: '2026-08-28' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['FIN-01: Any Credit Note > $50,000 requires VP/Manager authorization in UI', 'FIN-03: Freeze customer if > 30 days overdue'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['AML Anti-Fraud Guidelines']
      }
    },
    recentActions: [
      { id: 'act-fin1', timestamp: '14:28:10', action: 'Evaluated Credit Note #823 policy constraints', tool: 'Rule Engine', status: 'success', cost: 0.0000, durationMs: 6 },
      { id: 'act-fin2', timestamp: '14:28:11', action: 'Routed to Approval Center with evidence card', tool: 'Policy Engine', status: 'success', cost: 0.0000, durationMs: 25 }
    ],
    color: '#14b8a6'
  },
  {
    id: 'agent-operations-01',
    name: 'Logistics Dispatch Agent',
    codeName: 'LOGISTICS-01',
    avatar: '📦',
    role: 'Warehouse Picking & Waybill Dispatcher',
    departmentId: 'OPERATIONS',
    level: 7,
    status: 'ONLINE',
    statusMessage: 'Batching 48 packages for afternoon route via Andreani Express',
    primaryModel: 'Deterministic Rules + Qwen3 8B',
    fallbackModel: 'GPT-5.4 Nano',
    tasksToday: 1120,
    successRate: 99.0,
    avgCost: 0.00003,
    totalCostToday: 0.033,
    tools: ['Carrier Shipping API', 'Protheus SC9 Dispatch', 'Barcode Label Gen', 'Warehouse Map'],
    permissions: ['Dispatch:create', 'Inventory:reserve', 'Tracking:update'],
    skills: ['Route Optimization', 'Lot Tracking (FIFO)', 'Packing Slip Automation', 'Carrier Webhooks'],
    memory: {
      shortTerm: {
        currentContext: 'Generated 48 shipping labels for Order Batch #992',
        lastVariables: { batch_size: 48, carrier: 'Andreani', status: 'LABELS_READY' }
      },
      longTerm: {
        verifiedProceduresCount: 36,
        knownErrorPatternsCount: 11,
        snippets: [
          { title: 'Dangerous goods freight routing restriction', category: 'Logistics', description: 'Flammable SKUs cannot be shipped via standard air cargo', lastUsed: '2026-08-26' }
        ]
      },
      organizationalMemory: {
        companyRulesLoaded: ['OPS-01: Expedited orders must leave before 16:00', 'OPS-03: Multi-warehouse pick consolidation'],
        erpSchemaVersion: 'Protheus 12.1.2410-AR',
        fiscalPolicies: ['Carrier Hazardous Material Compliance']
      }
    },
    recentActions: [
      { id: 'act-o1', timestamp: '14:25:00', action: 'Reserved inventory in SC9 table', tool: 'SQL DB', status: 'success', cost: 0.0000, durationMs: 34 },
      { id: 'act-o2', timestamp: '14:25:05', action: 'Called Andreani Webhook to reserve tracking IDs', tool: 'Carrier API', status: 'success', cost: 0.0000, durationMs: 310 }
    ],
    color: '#ec4899'
  }
];

export const INITIAL_TOOLS: ToolDefinition[] = [
  {
    id: 'tool-protheus-api',
    name: 'Protheus REST API Suite',
    system: 'ERP_PROTHEUS',
    category: 'TRANSACTION',
    description: 'Direct REST endpoints to TOTVS Protheus web services (Invoices, Customers, Stock, Sales Orders).',
    inputSchema: '{"endpoint": "string", "method": "GET|POST|PUT", "payload": "object"}',
    outputSchema: '{"status": 200, "data": "object", "execution_time_ms": 140}',
    permissions: ['Invoice:create', 'Invoice:read', 'Customer:read'],
    risk: 'MEDIUM',
    requiresApproval: false,
    costPerCall: 0.0000,
    callsToday: 18450,
    avgLatencyMs: 142,
    isAvailable: true
  },
  {
    id: 'tool-sql-connector',
    name: 'Enterprise SQL DB Connector',
    system: 'SQL_DATABASE',
    category: 'READ',
    description: 'Safe parameterized SQL engine with tenant isolation and strict SELECT/DML permission guardrails.',
    inputSchema: '{"query": "string (parameterized)", "table": "string", "params": "array"}',
    outputSchema: '{"rows": "array", "count": 12, "cached": true}',
    permissions: ['SQL:select', 'SQL:explain'],
    risk: 'LOW',
    requiresApproval: false,
    costPerCall: 0.0000,
    callsToday: 42190,
    avgLatencyMs: 18,
    isAvailable: true
  },
  {
    id: 'tool-arca-tss',
    name: 'ARCA / TSS Electronic Invoicing Gateway',
    system: 'ARCA_TSS',
    category: 'TRANSACTION',
    description: 'Authorizes electronic CAE/CAI fiscal documents with AFIP / ARCA tax authority through TSS middleware.',
    inputSchema: '{"doc_type": "FACTURA_A|B|C", "fiscal_id": "CUIT", "amount": "number", "tes": "string"}',
    outputSchema: '{"cae": "74892019482910", "cae_due": "2026-09-08", "status": "AUTHORIZED"}',
    permissions: ['Fiscal:transmit', 'CAE:request'],
    risk: 'HIGH',
    requiresApproval: false,
    costPerCall: 0.0000,
    callsToday: 1240,
    avgLatencyMs: 420,
    isAvailable: true
  },
  {
    id: 'tool-credit-note',
    name: 'Create Authorized Credit Note',
    system: 'ERP_PROTHEUS',
    category: 'TRANSACTION',
    description: 'Issues a credit note against an authorized invoice. Triggers human-in-the-loop if amount > $50,000.',
    inputSchema: '{"invoice_id": "string", "amount": "number", "reason": "string", "customer_id": "string"}',
    outputSchema: '{"credit_note_id": "string", "status": "DRAFT|APPROVED", "cae": "string"}',
    permissions: ['CreditNote:create'],
    risk: 'HIGH',
    requiresApproval: true,
    costPerCall: 0.0000,
    callsToday: 48,
    avgLatencyMs: 210,
    isAvailable: true
  },
  {
    id: 'tool-sx3-inspector',
    name: 'SX3 / SIX Data Dictionary Inspector',
    system: 'ERP_PROTHEUS',
    category: 'DIAGNOSE',
    description: 'Inspects TOTVS Protheus metadata, field definitions, valid triggers, and database index alignments.',
    inputSchema: '{"table": "string", "field": "string", "inspect_triggers": true}',
    outputSchema: '{"definition": "object", "has_index": true, "is_mandatory": false}',
    permissions: ['Dictionary:inspect'],
    risk: 'LOW',
    requiresApproval: false,
    costPerCall: 0.0000,
    callsToday: 2310,
    avgLatencyMs: 24,
    isAvailable: true
  },
  {
    id: 'tool-whatsapp-api',
    name: 'WhatsApp Business Cloud API',
    system: 'WHATSAPP',
    category: 'COMMUNICATION',
    description: 'Sends and receives real-time customer WhatsApp messages with template validation and status receipts.',
    inputSchema: '{"to": "+54911...", "body": "string", "template_id": "optional string"}',
    outputSchema: '{"message_id": "wamid.HBg...", "status": "sent"}',
    permissions: ['WhatsApp:send', 'WhatsApp:read'],
    risk: 'LOW',
    requiresApproval: false,
    costPerCall: 0.0005,
    callsToday: 3890,
    avgLatencyMs: 180,
    isAvailable: true
  },
  {
    id: 'tool-bank-ofx',
    name: 'Multi-Bank Statement OFX & API Hub',
    system: 'BANK_API',
    category: 'READ',
    description: 'Connects to Santander, BBVA, and Galicia open banking APIs to pull daily clearing & wire movements.',
    inputSchema: '{"account_id": "string", "date_from": "YYYY-MM-DD", "date_to": "YYYY-MM-DD"}',
    outputSchema: '{"transactions": "array", "closing_balance": 1849200.50}',
    permissions: ['Bank:read_statement'],
    risk: 'LOW',
    requiresApproval: false,
    costPerCall: 0.0000,
    callsToday: 120,
    avgLatencyMs: 380,
    isAvailable: true
  },
  {
    id: 'tool-schema-patch',
    name: 'Database Schema Hot-Patcher',
    system: 'SQL_DATABASE',
    category: 'WRITE',
    description: 'Executes approved non-destructive SQL schema updates (DDL indexes, column defaults) with rollbacks.',
    inputSchema: '{"ddl_script": "string", "target_table": "string", "backup_verified": true}',
    outputSchema: '{"applied": true, "rollback_token": "RB-9941"}',
    permissions: ['DDL:execute_with_approval'],
    risk: 'HIGH',
    requiresApproval: true,
    costPerCall: 0.0000,
    callsToday: 3,
    avgLatencyMs: 890,
    isAvailable: true
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-5821',
    title: 'Invoice Transmission Failed: D2_TES field null on high-volume dispatch',
    departmentId: 'BILLING',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    startedAt: '14:31:15',
    orchestratorAgentId: 'agent-functional-01',
    participatingAgentIds: ['agent-billing-01', 'agent-functional-01', 'agent-infra-01'],
    currentStep: 'Correlating SX3 metadata dictionary with recent ERP customization release #41',
    hypotheses: [
      {
        id: 'hyp-1',
        hypothesis: 'Infrastructure / AppServer Network timeout during TSS call',
        proposedBy: 'Infrastructure Guardian',
        confidence: 0.12,
        status: 'DISPROVEN',
        reasoning: 'AppServer logs show TSS responded with HTTP 400 Bad Request in 140ms, ruling out socket connection failure.'
      },
      {
        id: 'hyp-2',
        hypothesis: 'Customer CUST-984 has invalid Tax Condition (Monotributo vs Inscripto)',
        proposedBy: 'Billing Agent Alpha',
        confidence: 0.38,
        status: 'DISPROVEN',
        reasoning: 'Customer CUIT 30-71289192-4 is verified Active Inscripto in AFIP cache table SA1.'
      },
      {
        id: 'hyp-3',
        hypothesis: 'SX3 Dictionary definition for field D2_TES in table SD2 is missing fallback default in branch 01',
        proposedBy: 'Functional Support Specialist',
        confidence: 0.94,
        status: 'CONFIRMED',
        reasoning: 'Direct query to SX3010 shows X3_RELACAO is empty for custom movement type M02.'
      }
    ],
    evidence: [
      {
        id: 'ev-1',
        sourceAgent: 'Billing Agent Alpha',
        type: 'API_PAYLOAD',
        title: 'TSS JSON Error Response 400',
        data: '{"error": "D2_TES cannot be null when transmitting Factura A", "doc": "18392", "field": "D2_TES", "value": null}',
        timestamp: '14:31:18'
      },
      {
        id: 'ev-2',
        sourceAgent: 'Infrastructure Guardian',
        type: 'LOG',
        title: 'AppServer Worker Thread Log',
        data: '[INFO] [Thread 412] Request completed in 142ms. Status 400 Bad Request. Upstream ARCA gateway ready.',
        timestamp: '14:31:22'
      },
      {
        id: 'ev-3',
        sourceAgent: 'Functional Support Specialist',
        type: 'SX3_CONFIG',
        title: 'SX3010 Field Definition for D2_TES',
        data: 'TABLE: SD2010 | CAMPO: D2_TES | TIPO: C | TAMANHO: 3 | USADO: X | RELACAO: "" (EMPTY) | VALID: ExistCpo("SF4")',
        timestamp: '14:31:45'
      }
    ],
    rootCause: 'Field D2_TES in table SD2 lacked a default fallback formula in SX3 dictionary for movement type M02, causing empty value on batch invoices.',
    suggestedFix: 'Apply SX3 dictionary patch: set X3_RELACAO = \'Iif(Empty(M->D2_TES), "501", M->D2_TES)\' and flush SX3 cache in AppServer.',
    costTotal: 0.00042,
    confidenceScore: 0.94
  }
];

export const INITIAL_APPROVALS: ApprovalRequest[] = [
  {
    id: 'APP-823',
    title: 'Authorize High-Value Credit Note #823 ($850,000 ARS)',
    amount: '$850,000.00 ARS',
    requestedByAgentId: 'agent-finance-01',
    requestedByAgentName: 'Credit Risk Evaluator',
    requestedByAvatar: '⚖️',
    departmentId: 'FINANCE',
    reason: 'Customer return due to damaged SKU batch #B-9912 on Order #7821',
    riskLevel: 'HIGH',
    status: 'PENDING',
    createdAt: '14:28:11',
    whatIKnow: [
      'Original Invoice #17420 for $850,000 was paid on 2026-08-15',
      'Warehouse receipt #WH-402 confirmed 100 units returned to Quarantine Depot',
      'Customer Distribuidora Central SA has a pristine payment rating of A+'
    ],
    whatIDontKnow: [
      'Whether the commercial director agreed to offer replacement merchandise instead of monetary credit'
    ],
    whatITried: [
      'Simulated credit limit check on SE1 table (Passes with $2.4M ceiling)',
      'Verified physical warehouse return receipt via Logistics Agent'
    ],
    whatFailed: [
      'Auto-approval policy FIN-01 blocked transaction (Amount exceeds $50,000 threshold for autonomous signing)'
    ],
    whatIRecommend: 'Approve the Credit Note issuance. Issue CAE with AFIP and credit customer ledger account.',
    whatINeedFromYou: 'Human authorization to sign the high-value transaction in Protheus.',
    evidencePayload: {
      invoice: '17420',
      customer: 'Distribuidora Central SA',
      returned_sku: 'SKU-4021',
      quarantine_wh: 'DEP_04',
      tax_withholding_credit: '$178,500 ARS'
    }
  },
  {
    id: 'APP-824',
    title: 'Apply Live Hot-Patch to SX3 Dictionary Table SD2010 (D2_TES Fallback)',
    amount: 'System Schema Patch',
    requestedByAgentId: 'agent-functional-01',
    requestedByAgentName: 'Functional Support Specialist',
    requestedByAvatar: '🔬',
    departmentId: 'FUNCTIONAL_SUPPORT',
    reason: 'Resolve Incident #5821 by installing autonomous default rule on D2_TES field',
    riskLevel: 'MEDIUM',
    status: 'PENDING',
    createdAt: '14:32:15',
    whatIKnow: [
      'Incident #5821 is blocking 4 invoices in the transmission queue',
      'SQL diff shows field X3_RELACAO is empty in production vs "501" in reference template',
      'A full backup of SX3010 table was executed at 14:32:00'
    ],
    whatIDontKnow: [
      'If any ongoing background job is currently locking the SX3 table'
    ],
    whatITried: [
      'Verified no active transaction locks in pg_stat_activity',
      'Tested patch in sandboxed staging environment with 100% success'
    ],
    whatFailed: [
      'Direct autonomous DDL update blocked by policy STD-09 (Schema modifications require human approval)'
    ],
    whatIRecommend: 'Execute UPDATE SX3010 SET X3_RELACAO = \'Iif(Empty(M->D2_TES), "501", M->D2_TES)\' WHERE X3_CAMPO = \'D2_TES\'',
    whatINeedFromYou: 'Click Approve to apply the patch and unblock the electronic invoice queue.',
    evidencePayload: {
      incident_id: 'INC-5821',
      table: 'SX3010',
      field: 'D2_TES',
      affected_invoices: ['18392', '18393', '18394', '18395'],
      rollback_command: 'UPDATE SX3010 SET X3_RELACAO = \'\' WHERE X3_CAMPO = \'D2_TES\''
    }
  }
];

export const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: 'ev-init-1',
    timestamp: '14:32:15',
    agentId: 'agent-billing-01',
    agentName: 'Billing Agent Alpha',
    agentAvatar: '🤖',
    departmentId: 'BILLING',
    type: 'success',
    title: 'Invoice #18391 Authorized',
    details: 'Received CAE #74892019482910 from ARCA/TSS. Dispatched PDF via Email to cliente@acme.com.',
    modelTier: 'RULE_ENGINE',
    modelName: 'Local Deterministic Rules',
    cost: 0.0000,
    tokens: { input: 0, output: 0 },
    toolUsed: 'ARCA TSS Gateway',
    targetDoc: 'INV-18391',
    latencyMs: 310
  },
  {
    id: 'ev-init-2',
    timestamp: '14:32:12',
    agentId: 'agent-customer-01',
    agentName: 'Customer Care Agent',
    agentAvatar: '💬',
    departmentId: 'CUSTOMER_SERVICE',
    type: 'info',
    title: 'WhatsApp Query Answered',
    details: 'Informed client Juan Perez: Order #9021 in transit with carrier Andreani. Delivery estimated tomorrow 11:00.',
    modelTier: 'LOCAL_QWEN_8B',
    modelName: 'Qwen3 8B AWQ (Local GPU)',
    cost: 0.0000,
    tokens: { input: 340, output: 85 },
    toolUsed: 'WhatsApp API',
    targetDoc: 'SO-9021',
    latencyMs: 290
  },
  {
    id: 'ev-init-3',
    timestamp: '14:31:50',
    agentId: 'agent-functional-01',
    agentName: 'Functional Support Specialist',
    agentAvatar: '🔬',
    departmentId: 'FUNCTIONAL_SUPPORT',
    type: 'alert',
    title: 'Root Cause Identified in Incident #5821',
    details: 'SX3 table SD2 has empty D2_TES default formula. Prepared schema patch #APP-824 for human approval.',
    modelTier: 'LOCAL_QWEN_8B',
    modelName: 'Qwen3 8B AWQ (Local GPU)',
    cost: 0.0000,
    tokens: { input: 620, output: 140 },
    toolUsed: 'SQL DB Connector',
    targetDoc: 'INC-5821',
    latencyMs: 410
  },
  {
    id: 'ev-init-4',
    timestamp: '14:31:05',
    agentId: 'agent-accounting-01',
    agentName: 'Accounting Conciliator',
    agentAvatar: '📊',
    departmentId: 'ACCOUNTING',
    type: 'success',
    title: 'Santander Bank Batch #981 Reconciled',
    details: '142 bank receipts matched 1:1 against SE1 ledger. 0 variance detected. Journal entry posted.',
    modelTier: 'RULE_ENGINE',
    modelName: 'Local Deterministic Rules',
    cost: 0.0000,
    tokens: { input: 0, output: 0 },
    toolUsed: 'Protheus API',
    targetDoc: 'BATCH-981',
    latencyMs: 190
  },
  {
    id: 'ev-init-5',
    timestamp: '14:30:15',
    agentId: 'agent-sales-01',
    agentName: 'Sales Quotation Agent',
    agentAvatar: '📈',
    departmentId: 'SALES',
    type: 'success',
    title: 'Sales Quote #Q-7782 Created',
    details: 'Generated quote for Distribuidora Norte ($14,200). Verified stock across 2 warehouses.',
    modelTier: 'LOCAL_QWEN_8B',
    modelName: 'Qwen3 8B AWQ (Local GPU)',
    cost: 0.0000,
    tokens: { input: 280, output: 95 },
    toolUsed: 'Protheus Pricing Engine',
    targetDoc: 'QUOTE-7782',
    latencyMs: 160
  },
  {
    id: 'ev-init-6',
    timestamp: '14:28:11',
    agentId: 'agent-finance-01',
    agentName: 'Credit Risk Evaluator',
    agentAvatar: '⚖️',
    departmentId: 'FINANCE',
    type: 'approval',
    title: 'Approval Required: Credit Note #823',
    details: 'Amount $850,000 exceeds autonomous ceiling. Routed to human manager with evidence dossier.',
    modelTier: 'LOCAL_QWEN_8B',
    modelName: 'Qwen3 8B AWQ (Local GPU)',
    cost: 0.0000,
    tokens: { input: 410, output: 110 },
    toolUsed: 'Policy Engine',
    targetDoc: 'APP-823',
    latencyMs: 220
  }
];

export const INITIAL_METRICS: ObservabilityMetrics = {
  totalAgents: 42,
  activeAgents: 17,
  tasksToday: 38291,
  successRate: 98.4,
  deterministicOps: 34912, // 91.1%
  localModelCalls: 3812,   // 8.0%
  cheapApiCalls: 1293,     // 0.8%
  premiumApiCalls: 18,     // 0.04%
  totalAiCost: 18.32,
  costSavedVsPureCloud: 842.60,
  avgCostPerTask: 0.00048,
  gpuStats: {
    gpuName: 'NVIDIA GeForce RTX 5070 Ti 12GB',
    vramUsedGb: 6.8,
    vramTotalGb: 12.0,
    utilizationPercent: 42,
    activeBatchSize: 8,
    queueLength: 0,
    temperatureC: 54
  }
};
