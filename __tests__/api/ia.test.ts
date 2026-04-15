/**
 * Tests del módulo IA
 *
 * Estrategia:
 * - isIAEnabled / getAIConfig: unit puro, sin DB
 * - buildEmpresaContexto: Prisma mockeado vía mockPrismaClient del setup
 * - ai-business (chat, alertas, proyeccion): mock de buildEmpresaContexto + aiService
 * - Endpoints: mock de getAuthContext + isIAEnabled + aiService
 *
 * NO necesita DB ni Ollama.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mockPrismaClient } from "../setup"

// ── Extender el mock de Prisma con métodos que faltan en setup.ts ─────────────
// setup.ts genera los métodos básicos pero no findUniqueOrThrow ni modelos IA
beforeEach(() => {
  // findUniqueOrThrow para empresa
  if (!mockPrismaClient.empresa.findUniqueOrThrow) {
    mockPrismaClient.empresa.findUniqueOrThrow = vi.fn()
  }
  // Modelos IA que no están en el setup original
  const modIA = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  })
  if (!mockPrismaClient.alertaIA) mockPrismaClient.alertaIA = modIA()
  if (!mockPrismaClient.chatIAHistorial) mockPrismaClient.chatIAHistorial = modIA()
  if (!mockPrismaClient.reporteIA) mockPrismaClient.reporteIA = modIA()
  if (!mockPrismaClient.mensajePendienteWhatsApp) mockPrismaClient.mensajePendienteWhatsApp = modIA()
})

// ── Mock del servicio IA (no se necesita Ollama ni API key) ──────────────────
vi.mock("@/lib/ai/ai-service", () => ({
  aiService: {
    isAvailable: vi.fn().mockResolvedValue({ available: true, provider: "ollama", model: "qwen2.5:14b" }),
    chat: vi.fn().mockResolvedValue({ content: "Respuesta de prueba", model: "qwen2.5:14b", provider: "ollama", durationMs: 100 }),
    chatJson: vi.fn().mockResolvedValue({ data: null, raw: "", model: "qwen2.5:14b", provider: "ollama", durationMs: 100 }),
    getLoadedModels: vi.fn().mockResolvedValue(["qwen2.5:14b-instruct-q5_K_M", "mistral:7b-instruct-v0.3-q4_K_M"]),
    reload: vi.fn(),
  },
}))

// ── Mock de auth (JWT válido por defecto) ─────────────────────────────────────
vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn().mockResolvedValue({
    ok: true,
    auth: { userId: 1, email: "admin@test.com", rol: "administrador", empresaId: 1 },
  }),
  whereEmpresa: vi.fn((id: number, extra = {}) => ({ ...extra, empresaId: id })),
}))

// ── Mock de buildEmpresaContexto (evita 14 queries a Prisma en tests de negocio)
vi.mock("@/lib/ai/context-builder", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/ai/context-builder")>()
  return {
    ...real,
    buildEmpresaContexto: vi.fn().mockResolvedValue({
      empresa: { id: 1, nombre: "Test Negocio", rubro: "gastronomia", cuit: "20123456789", condicionIva: "Responsable Inscripto" },
      snapshot: {
        ventasHoy: { total: 50000, cantidad: 10 },
        ventasSemana: { total: 200000, cantidad: 40 },
        ventasMes: { total: 800000, cantidad: 160 },
        ticketPromedio: 5000,
        stockCritico: [{ nombre: "Pan de hamburguesa", stock: 5, stockMinimo: 20, unidad: "unidad" }],
        topProductos: [{ nombre: "Hamburguesa Clásica", cantidad: 100, total: 200000 }],
        clientesDeudores: [],
        turnosPendientesHoy: 3,
        turnosPendientesManana: 5,
        cajaAbierta: true,
        saldoCaja: 13000,
      },
      maestros: {
        productos: [{ sku: "HAM001", nombre: "Hamburguesa", descripcion: null, precio: 2000, precioCompra: 1000, stock: 50, stockMinimo: 10, unidad: "unidad", categoria: "Comidas", activo: true, esPlato: true, esInsumo: false }],
        clientes: [],
        proveedores: [],
        categorias: [{ nombre: "Comidas", cantidadProductos: 10 }],
        totalProductos: 25,
        totalClientes: 10,
        totalProveedores: 5,
      },
      historico: {
        ventasUltimos30Dias: [{ fecha: "2026-04-01", total: 15000, cantidad: 3 }],
        productosEstancados: [],
        clientesInactivos: [],
      },
      config: { moneda: "ARS", timezone: "America/Argentina/Buenos_Aires" },
    }),
  }
})

// ─── 1. isIAEnabled() ─────────────────────────────────────────────────────────

describe("isIAEnabled()", () => {
  afterEach(() => {
    delete process.env.AI_ENABLED
  })

  it("retorna false cuando AI_ENABLED=false (kill switch global)", async () => {
    process.env.AI_ENABLED = "false"
    const { isIAEnabled } = await import("@/lib/ai/ia-guard")
    expect(await isIAEnabled(1)).toBe(false)
  })

  it("retorna true cuando no hay registro en DB (habilitado por defecto)", async () => {
    process.env.AI_ENABLED = "true"
    mockPrismaClient.configuracionModulo.findUnique.mockResolvedValue(null)
    const { isIAEnabled } = await import("@/lib/ai/ia-guard")
    expect(await isIAEnabled(1)).toBe(true)
  })

  it("retorna true cuando habilitado=true en DB", async () => {
    process.env.AI_ENABLED = "true"
    mockPrismaClient.configuracionModulo.findUnique.mockResolvedValue({ habilitado: true })
    const { isIAEnabled } = await import("@/lib/ai/ia-guard")
    expect(await isIAEnabled(1)).toBe(true)
  })

  it("retorna false cuando habilitado=false en DB aunque AI_ENABLED=true", async () => {
    process.env.AI_ENABLED = "true"
    mockPrismaClient.configuracionModulo.findUnique.mockResolvedValue({ habilitado: false })
    const { isIAEnabled } = await import("@/lib/ai/ia-guard")
    expect(await isIAEnabled(1)).toBe(false)
  })
})

// ─── 2. getAIConfig() — env vars configurables ────────────────────────────────

describe("getAIConfig()", () => {
  afterEach(() => {
    ;[
      "AI_MAX_TOKENS", "AI_TEMPERATURE", "AI_CONTEXT_CACHE_TTL_MS",
      "AI_MAX_ALERTAS", "AI_CHAT_HISTORY_PAIRS", "AI_PROVIDER",
    ].forEach(k => delete process.env[k])
  })

  it("devuelve defaults correctos sin env vars", async () => {
    const { getAIConfig } = await import("@/lib/ai/ai-config")
    const c = getAIConfig()
    expect(c.provider).toBe("auto")
    expect(c.maxTokens).toBe(4096)
    expect(c.temperature).toBe(0.3)
    expect(c.contextCacheTtlMs).toBe(60_000)
    expect(c.maxAlertas).toBe(8)
    expect(c.chatHistoryPairs).toBe(10)
    expect(c.maxConcurrency).toBe(2)
  })

  it("lee todas las env vars de parametrización", async () => {
    process.env.AI_MAX_TOKENS = "2048"
    process.env.AI_TEMPERATURE = "0.7"
    process.env.AI_CONTEXT_CACHE_TTL_MS = "30000"
    process.env.AI_MAX_ALERTAS = "5"
    process.env.AI_CHAT_HISTORY_PAIRS = "3"
    process.env.AI_PROVIDER = "anthropic"

    // getAIConfig lee directamente process.env sin cachear, no hace falta resetModules
    const { getAIConfig } = await import("@/lib/ai/ai-config")
    const c = getAIConfig()
    expect(c.maxTokens).toBe(2048)
    expect(c.temperature).toBe(0.7)
    expect(c.contextCacheTtlMs).toBe(30_000)
    expect(c.maxAlertas).toBe(5)
    expect(c.chatHistoryPairs).toBe(3)
    expect(c.provider).toBe("anthropic")
  })

  it("enabled=false cuando AI_ENABLED=false", async () => {
    process.env.AI_ENABLED = "false"
    const { getAIConfig } = await import("@/lib/ai/ai-config")
    expect(getAIConfig().enabled).toBe(false)
    delete process.env.AI_ENABLED
  })
})

// ─── 3. buildEmpresaContexto() — saldo caja real ─────────────────────────────

describe("buildEmpresaContexto() — saldo caja", () => {
  // Testear la función real (sin el mock del módulo completo)
  // Para esto llamamos directamente la función importada antes de que el mock la sobreescriba
  // Usamos el Prisma mock de setup.ts

  beforeEach(() => {
    // Setup mínimo para las 21 queries del context-builder (Promise.allSettled)
    mockPrismaClient.empresa.findUniqueOrThrow.mockResolvedValue({
      id: 1, nombre: "Test", rubro: "gastronomia", cuit: "20123456789", condicionIva: "Responsable Inscripto",
    })
    mockPrismaClient.factura.aggregate.mockResolvedValue({ _sum: { total: 50000 }, _count: { id: 10 } })
    mockPrismaClient.factura.findMany.mockResolvedValue([])
    mockPrismaClient.producto.findMany.mockResolvedValue([])
    mockPrismaClient.producto.count.mockResolvedValue(0)
    mockPrismaClient.lineaFactura.groupBy.mockResolvedValue([])
    mockPrismaClient.cuentaCobrar.findMany.mockResolvedValue([])
    mockPrismaClient.turno.count.mockResolvedValue(0)
    mockPrismaClient.cliente.findMany.mockResolvedValue([])
    mockPrismaClient.cliente.count.mockResolvedValue(0)
    mockPrismaClient.proveedor.findMany.mockResolvedValue([])
    mockPrismaClient.proveedor.count.mockResolvedValue(0)
    mockPrismaClient.categoria.findMany.mockResolvedValue([])
  })

  it("saldoCaja = saldoInicial + ingresos - egresos (no solo saldoInicial)", async () => {
    mockPrismaClient.caja.findFirst.mockResolvedValue({
      saldoInicial: 1000,
      movimientos: [
        { tipo: "ingreso", monto: 5000 },
        { tipo: "ingreso", monto: 3000 },
        { tipo: "egreso",  monto: 500  },
      ],
    })

    // vi.importActual evita el mock global y llama la implementación real
    const real = await vi.importActual<typeof import("@/lib/ai/context-builder")>("@/lib/ai/context-builder")
    real.invalidateContextCache(1)
    const ctx = await real.buildEmpresaContexto(1)

    // 1000 + 5000 + 3000 - 500 = 8500
    expect(ctx.snapshot.saldoCaja).toBe(8500)
    expect(ctx.snapshot.cajaAbierta).toBe(true)
  })

  it("saldoCaja = 0 y cajaAbierta = false cuando no hay caja abierta", async () => {
    mockPrismaClient.caja.findFirst.mockResolvedValue(null)

    const real = await vi.importActual<typeof import("@/lib/ai/context-builder")>("@/lib/ai/context-builder")
    real.invalidateContextCache(1)
    const ctx = await real.buildEmpresaContexto(1)

    expect(ctx.snapshot.saldoCaja).toBe(0)
    expect(ctx.snapshot.cajaAbierta).toBe(false)
  })

  it("stockCritico solo incluye productos con stock <= stockMinimo", async () => {
    mockPrismaClient.caja.findFirst.mockResolvedValue(null)
    const hace10Dias = new Date(Date.now() - 10 * 86400000)
    mockPrismaClient.producto.findMany.mockResolvedValue([
      { nombre: "Crítico", stock: 5,  stockMinimo: 20, unidad: "u", updatedAt: hace10Dias },
      { nombre: "OK",      stock: 50, stockMinimo: 20, unidad: "u", updatedAt: hace10Dias },
    ])

    const real = await vi.importActual<typeof import("@/lib/ai/context-builder")>("@/lib/ai/context-builder")
    real.invalidateContextCache(1)
    const ctx = await real.buildEmpresaContexto(1)

    expect(ctx.snapshot.stockCritico).toHaveLength(1)
    expect(ctx.snapshot.stockCritico[0].nombre).toBe("Crítico")
  })
})

// ─── 4. chatConNegocio() — truncado de historial ─────────────────────────────

describe("chatConNegocio()", () => {
  it("devuelve respuesta del modelo", async () => {
    const { aiService } = await import("@/lib/ai/ai-service")
    vi.mocked(aiService.isAvailable).mockResolvedValue({ available: true, provider: "ollama", model: "qwen2.5:14b" })
    vi.mocked(aiService.chat).mockResolvedValue({ content: "Hoy vendiste $50.000.", model: "qwen2.5:14b", provider: "ollama", durationMs: 100 })

    const { chatConNegocio } = await import("@/lib/ai/ai-business")
    const r = await chatConNegocio(1, "¿Cómo estoy hoy?", [])
    expect(r).toContain("50.000")
  })

  it("retorna mensaje de fallback cuando IA no está disponible", async () => {
    const { aiService } = await import("@/lib/ai/ai-service")
    vi.mocked(aiService.isAvailable).mockResolvedValue({ available: false, provider: "none", model: "disabled" })

    const { chatConNegocio } = await import("@/lib/ai/ai-business")
    const r = await chatConNegocio(1, "hola", [])
    expect(r).toMatch(/no está disponible/i)
  })

  it("trunca historial de más de 10 pares antes de enviar al modelo", async () => {
    const { aiService } = await import("@/lib/ai/ai-service")
    vi.mocked(aiService.isAvailable).mockResolvedValue({ available: true, provider: "ollama", model: "qwen2.5:14b" })
    vi.mocked(aiService.chat).mockClear()
    vi.mocked(aiService.chat).mockResolvedValue({ content: "OK", model: "qwen2.5:14b", provider: "ollama", durationMs: 50 })

    const { chatConNegocio } = await import("@/lib/ai/ai-business")

    // 30 pares = 60 mensajes — supera el límite de 10 pares
    const historialLargo = Array.from({ length: 60 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Mensaje ${i}`,
    }))

    await chatConNegocio(1, "nueva pregunta", historialLargo)

    const calls = vi.mocked(aiService.chat).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const messages = calls[calls.length - 1][0]
    // system (1) + truncado (≤20 msgs de 10 pares) + user actual (1) = ≤22
    expect(messages.length).toBeLessThanOrEqual(22)
  })
})

// ─── 5. generarAlertasInteligentes() ─────────────────────────────────────────

describe("generarAlertasInteligentes()", () => {
  it("retorna lista vacía cuando el modelo devuelve JSON inválido", async () => {
    const { aiService } = await import("@/lib/ai/ai-service")
    vi.mocked(aiService.chatJson).mockResolvedValue({
      data: null, raw: "no json", model: "q", provider: "ollama", durationMs: 100, error: "invalid_json"
    })

    const { generarAlertasInteligentes } = await import("@/lib/ai/ai-business")
    const r = await generarAlertasInteligentes(1)
    expect(r.alertas).toEqual([])
  })

  it("retorna alertas parseadas y validadas con Zod", async () => {
    const { aiService } = await import("@/lib/ai/ai-service")
    vi.mocked(aiService.chatJson).mockResolvedValue({
      data: {
        alertas: [
          {
            tipo: "stock_critico",
            prioridad: "alta",
            titulo: "Stock bajo: Pan de hamburguesa",
            descripcion: "Quedan 5 unidades, mínimo 20",
            accion_sugerida: "Pedir urgente",
          },
        ]
      },
      raw: "", model: "qwen2.5:14b", provider: "ollama", durationMs: 200
    })

    const { generarAlertasInteligentes } = await import("@/lib/ai/ai-business")
    const r = await generarAlertasInteligentes(1)
    expect(r.alertas).toHaveLength(1)
    expect(r.alertas[0].tipo).toBe("stock_critico")
    expect(r.alertas[0].prioridad).toBe("alta")
  })

  it("rechaza alertas con tipo o prioridad inválida (Zod schema)", async () => {
    const { aiService } = await import("@/lib/ai/ai-service")
    vi.mocked(aiService.chatJson).mockResolvedValue({
      data: {
        alertas: [{ tipo: "tipo_inventado", prioridad: "maxima", titulo: "X", descripcion: "Y" }]
      },
      raw: "", model: "qwen2.5:14b", provider: "ollama", durationMs: 100
    })

    const { generarAlertasInteligentes } = await import("@/lib/ai/ai-business")
    const r = await generarAlertasInteligentes(1)
    // Zod rechaza el schema → fallback a lista vacía
    expect(r.alertas).toEqual([])
  })
})

// ─── 6. GET /api/ai/status ────────────────────────────────────────────────────

describe("GET /api/ai/status", () => {
  it("responde 200 con estructura completa sin requerir auth", async () => {
    const { GET } = await import("@/app/api/ai/status/route")
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.ai).toMatchObject({ enabled: expect.any(Boolean), available: expect.any(Boolean) })
    expect(json.ollama).toBeDefined()
    expect(json.anthropic).toMatchObject({ configured: expect.any(Boolean) })
    expect(json.rubrosConIA).toBeInstanceOf(Array)
    expect(json.rubrosConIA.length).toBeGreaterThan(0)
  })

  it("lista rubros con features de IA (al menos un rubro con top3)", async () => {
    const { GET } = await import("@/app/api/ai/status/route")
    const res = await GET()
    const json = await res.json()

    expect(json.rubrosConIA.length).toBeGreaterThan(0)
    const alguno = json.rubrosConIA[0]
    expect(alguno.rubro).toBeDefined()
    expect(alguno.featuresCount).toBeGreaterThan(0)
    expect(alguno.top3).toBeInstanceOf(Array)
  })
})

// ─── 7. POST /api/ai/chat ─────────────────────────────────────────────────────

describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    mockPrismaClient.configuracionModulo.findUnique.mockResolvedValue({ habilitado: true })
    mockPrismaClient.chatIAHistorial.findMany.mockResolvedValue([])
    mockPrismaClient.chatIAHistorial.create.mockResolvedValue({ id: 1 })
    mockPrismaClient.$transaction.mockImplementation(async (ops: any) =>
      typeof ops === "function" ? ops(mockPrismaClient) : Promise.all(ops)
    )
  })

  const makePost = (body: object) =>
    new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
      body: JSON.stringify(body),
    })

  it("retorna 403 cuando módulo IA no está activo", async () => {
    mockPrismaClient.configuracionModulo.findUnique.mockResolvedValue({ habilitado: false })
    const { POST } = await import("@/app/api/ai/chat/route")
    const res = await POST(makePost({ mensaje: "hola" }) as any)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toMatch(/no está habilitado/i)
  })

  it("retorna 400 cuando mensaje está vacío", async () => {
    const { POST } = await import("@/app/api/ai/chat/route")
    const res = await POST(makePost({ mensaje: "" }) as any)
    expect(res.status).toBe(400)
  })

  it("retorna 400 cuando mensaje supera 2000 caracteres", async () => {
    const { POST } = await import("@/app/api/ai/chat/route")
    const res = await POST(makePost({ mensaje: "x".repeat(2001) }) as any)
    expect(res.status).toBe(400)
  })

  it("retorna 200 con respuesta y persiste historial", async () => {
    process.env.AI_ENABLED = "true"
    const { aiService } = await import("@/lib/ai/ai-service")
    vi.mocked(aiService.chat).mockResolvedValue({ content: "Todo bien hoy.", model: "qwen2.5:14b", provider: "ollama", durationMs: 100 })

    const { POST } = await import("@/app/api/ai/chat/route")
    const res = await POST(makePost({ mensaje: "¿Cómo estoy hoy?" }) as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.respuesta).toBe("Todo bien hoy.")
    expect(mockPrismaClient.$transaction).toHaveBeenCalled()
    delete process.env.AI_ENABLED
  })
})

// ─── 8. PATCH /api/ai/alertas — validación Zod ────────────────────────────────

describe("PATCH /api/ai/alertas", () => {
  beforeEach(() => {
    mockPrismaClient.alertaIA.findFirst.mockResolvedValue({ id: 1, empresaId: 1 })
    mockPrismaClient.alertaIA.update.mockResolvedValue({ id: 1, leida: true })
  })

  const makePatch = (body: object) =>
    new Request("http://localhost/api/ai/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
      body: JSON.stringify(body),
    })

  it("retorna 400 cuando id es string en vez de número", async () => {
    const { PATCH } = await import("@/app/api/ai/alertas/route")
    const res = await PATCH(makePatch({ id: "hola", leida: true }) as any)
    expect(res.status).toBe(400)
  })

  it("retorna 400 cuando falta el campo id", async () => {
    const { PATCH } = await import("@/app/api/ai/alertas/route")
    const res = await PATCH(makePatch({ leida: true }) as any)
    expect(res.status).toBe(400)
  })

  it("retorna 400 cuando id es negativo", async () => {
    const { PATCH } = await import("@/app/api/ai/alertas/route")
    const res = await PATCH(makePatch({ id: -1, leida: true }) as any)
    expect(res.status).toBe(400)
  })

  it("actualiza alerta correctamente con datos válidos", async () => {
    const { PATCH } = await import("@/app/api/ai/alertas/route")
    const res = await PATCH(makePatch({ id: 1, leida: true, resuelta: false }) as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockPrismaClient.alertaIA.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    )
  })
})
