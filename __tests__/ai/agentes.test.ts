/**
 * Agent System — Unit Tests
 *
 * Tests agent registration, execution lifecycle, concurrency guard,
 * event-based triggering, status reporting, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock AI service so agents don't call the real LLM
vi.mock("@/lib/ai/ai-service", () => ({
  aiService: {
    isAvailable: vi.fn().mockResolvedValue(true),
    chat: vi.fn().mockResolvedValue("test response"),
    chatJson: vi.fn().mockResolvedValue({ posts: [] }),
  },
}))

vi.mock("@/lib/ai/analyzers", () => ({
  analizarAlertasInteligentes: vi.fn().mockResolvedValue([]),
  analizarCobranza: vi.fn().mockResolvedValue({ mensaje: "test" }),
  predecirCompras: vi.fn().mockResolvedValue([]),
  detectarAnomalias: vi.fn().mockResolvedValue([]),
  clasificarProducto: vi.fn().mockResolvedValue({ categoria: "test" }),
  procesarOnboardingConversacional: vi.fn().mockResolvedValue({ rubro: "retail" }),
}))

vi.mock("@/lib/ai/ai-business", () => ({
  generarReporte: vi.fn().mockResolvedValue({ resumen: "test", recomendaciones: [] }),
  generarMensajesWhatsApp: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/ai/context-builder", () => ({
  buildEmpresaContexto: vi.fn().mockResolvedValue({
    nombre: "Test Empresa",
    rubro: "retail",
  }),
}))

// Mock IA guard
vi.mock("@/lib/ai/ia-guard", () => ({
  isIAEnabled: vi.fn().mockResolvedValue(true),
}))

let AgentRegistry: any
let AgentBase: any
let agentRegistry: any

beforeEach(async () => {
  vi.clearAllMocks()
  vi.resetModules()

  // Default mocks for Prisma
  mockPrismaClient.configuracionModulo.findUnique.mockResolvedValue(null)
  mockPrismaClient.agenteLog.create.mockResolvedValue({ id: 1 })
  mockPrismaClient.agenteLog.findFirst.mockResolvedValue(null)
  mockPrismaClient.agenteLog.count.mockResolvedValue(0)
  mockPrismaClient.agenteLog.aggregate.mockResolvedValue({ _sum: { accionesEjecutadas: 0 } })
  mockPrismaClient.agenteLog.groupBy.mockResolvedValue([])
  mockPrismaClient.empresa.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])

  // Import fresh
  const registryMod = await import("@/lib/ai/agents/agent-registry")
  agentRegistry = registryMod.agentRegistry

  const baseMod = await import("@/lib/ai/agents/agent-base")
  AgentBase = baseMod.AgentBase
})

// ─── Helper: create a dummy agent ─────────────────────────────────────────────

function createTestAgent(
  id: string,
  opts: { reactsTo?: string[]; defaultEnabled?: boolean; executeFn?: () => Promise<any> } = {},
) {
  const agent = Object.create(AgentBase.prototype)
  agent.config = {
    id,
    nombre: `Test Agent ${id}`,
    descripcion: "Test agent for unit tests",
    icono: "test",
    categoria: "operativo",
    tier: "starter",
    schedule: { type: "manual", label: "Manual" },
    reactsTo: opts.reactsTo ?? [],
    defaultEnabled: opts.defaultEnabled ?? true,
  }
  agent.execute =
    opts.executeFn ??
    vi.fn().mockResolvedValue({
      resumen: `${id} completed`,
      acciones: [{ tipo: "test", descripcion: "test action", cantidad: 1 }],
    })
  return agent
}

describe("AgentRegistry", () => {
  it("should register and retrieve agents", () => {
    const agent = createTestAgent("test-1")
    agentRegistry.register(agent)

    expect(agentRegistry.get("test-1")).toBe(agent)
    expect(agentRegistry.getAll().length).toBeGreaterThanOrEqual(1)
  })

  it("should return undefined for unregistered agents", () => {
    expect(agentRegistry.get("nonexistent")).toBeUndefined()
  })

  it("should execute agent and return result", async () => {
    const agent = createTestAgent("exec-test")
    agentRegistry.register(agent)

    const result = await agentRegistry.executeAgent("exec-test", {
      empresaId: 1,
      triggeredBy: "manual",
    })

    // Should not error (agent.run calls internal lifecycle)
    expect(result).toBeDefined()
    expect(result.agentId).toBe("exec-test")
  })

  it("should return error for non-existent agent", async () => {
    const result = await agentRegistry.executeAgent("ghost-agent", {
      empresaId: 1,
      triggeredBy: "manual",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Agent not found")
  })

  it("should prevent concurrent execution of same agent for same empresa", async () => {
    // Create a slow agent
    let resolveExecution: () => void
    const slowPromise = new Promise<void>((resolve) => {
      resolveExecution = resolve
    })

    const slowAgent = createTestAgent("slow-agent", {
      executeFn: vi.fn(async () => {
        await slowPromise
        return { resumen: "done", acciones: [] }
      }),
    })
    agentRegistry.register(slowAgent)

    // Start first execution (won't complete until we resolve)
    const first = agentRegistry.executeAgent("slow-agent", {
      empresaId: 1,
      triggeredBy: "manual",
    })

    // Must wait a tick for the first to actually start
    await new Promise((r) => setTimeout(r, 10))

    // Second execution should be blocked
    const second = await agentRegistry.executeAgent("slow-agent", {
      empresaId: 1,
      triggeredBy: "manual",
    })

    expect(second.success).toBe(false)
    expect(second.error).toBe("Already running")

    // Clean up
    resolveExecution!()
    await first
  })

  it("should allow same agent for different empresas", async () => {
    const agent = createTestAgent("multi-empresa")
    agentRegistry.register(agent)

    // Both should start
    const [r1, r2] = await Promise.all([
      agentRegistry.executeAgent("multi-empresa", { empresaId: 1, triggeredBy: "manual" }),
      agentRegistry.executeAgent("multi-empresa", { empresaId: 2, triggeredBy: "manual" }),
    ])

    expect(r1.agentId).toBe("multi-empresa")
    expect(r2.agentId).toBe("multi-empresa")
  })

  it("should check running status correctly", () => {
    expect(agentRegistry.isRunning("any", 1)).toBe(false)
  })

  it("should trigger agents by event type", async () => {
    const stockAgent = createTestAgent("event-stock", { reactsTo: ["STOCK_ACTUALIZADO"] })
    const salesAgent = createTestAgent("event-sales", { reactsTo: ["FACTURA_EMITIDA"] })
    agentRegistry.register(stockAgent)
    agentRegistry.register(salesAgent)

    const results = await agentRegistry.handleEvent("STOCK_ACTUALIZADO", 1, { productoId: 5 })

    // Only the stock agent should have been triggered
    const triggeredIds = results.map((r: any) => r.agentId)
    expect(triggeredIds).toContain("event-stock")
    expect(triggeredIds).not.toContain("event-sales")
  })

  it("should get status for empresa with defaults", async () => {
    const agent = createTestAgent("status-test", { defaultEnabled: true })
    agentRegistry.register(agent)

    const statuses = await agentRegistry.getStatusForEmpresa(1)
    const status = statuses.find((s: any) => s.agentId === "status-test")

    expect(status).toBeDefined()
    expect(status.enabled).toBe(true)
    expect(status.status).toBe("idle")
    expect(status.totalRuns).toBe(0)
  })

  it("should respect ConfiguracionModulo for enabled state", async () => {
    const agent = createTestAgent("config-test", { defaultEnabled: true })
    agentRegistry.register(agent)

    // Module disabled in DB
    mockPrismaClient.configuracionModulo.findUnique.mockResolvedValue({ habilitado: false })

    const statuses = await agentRegistry.getStatusForEmpresa(1)
    const status = statuses.find((s: any) => s.agentId === "config-test")

    expect(status.enabled).toBe(false)
    expect(status.status).toBe("disabled")
  })
})
