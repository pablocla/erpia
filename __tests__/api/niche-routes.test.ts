import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { GET as getNiche, POST as postNiche } from "@/app/api/niche/[appId]/route"
import { GET as getConsorcios, POST as postConsorcios } from "@/app/api/consorcios/route"
import { POST as postClienteRapido } from "@/app/api/niche/clientes-rapido/route"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import {
  crearMovimientoNiche,
  listarMovimientosNiche,
  resumenNiche,
  actualizarEstadoMovimiento,
} from "@/lib/niche/movimientos-service"
import { encolarWhatsAppNiche, enviarWhatsAppMasivoNiche } from "@/lib/niche/niche-whatsapp"
import { crearConsorcio, listarConsorcios } from "@/lib/niche/consorcios-api-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
}))

vi.mock("@/lib/platform/entitlements", () => ({
  canUseSku: vi.fn(),
}))

vi.mock("@/lib/niche/movimientos-service", () => ({
  crearMovimientoNiche: vi.fn(),
  listarMovimientosNiche: vi.fn(),
  resumenNiche: vi.fn(),
  actualizarEstadoMovimiento: vi.fn(),
}))

vi.mock("@/lib/niche/cuotas-service", () => ({
  listarSociosNiche: vi.fn(),
  registrarCuotaNiche: vi.fn(),
  listarMorososCuota: vi.fn(),
}))

vi.mock("@/lib/niche/niche-whatsapp", () => ({
  encolarWhatsAppNiche: vi.fn(),
  enviarWhatsAppMasivoNiche: vi.fn(),
}))

vi.mock("@/lib/niche/consorcios-api-service", () => ({
  listarConsorcios: vi.fn(),
  crearConsorcio: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cliente: { create: vi.fn() },
  },
}))

const mockAuth = getAuthContext as unknown as ReturnType<typeof vi.fn>
const mockCanUseSku = canUseSku as unknown as ReturnType<typeof vi.fn>
const mockListarMov = listarMovimientosNiche as unknown as ReturnType<typeof vi.fn>
const mockResumen = resumenNiche as unknown as ReturnType<typeof vi.fn>
const mockCrearMov = crearMovimientoNiche as unknown as ReturnType<typeof vi.fn>
const mockActualizar = actualizarEstadoMovimiento as unknown as ReturnType<typeof vi.fn>
const mockEncolarWa = encolarWhatsAppNiche as unknown as ReturnType<typeof vi.fn>
const mockWaMasivo = enviarWhatsAppMasivoNiche as unknown as ReturnType<typeof vi.fn>
const mockListarCons = listarConsorcios as unknown as ReturnType<typeof vi.fn>
const mockCrearCons = crearConsorcio as unknown as ReturnType<typeof vi.fn>
const mockClienteCreate = prisma.cliente.create as unknown as ReturnType<typeof vi.fn>

const authOk = { ok: true, auth: { empresaId: 1, usuarioId: 1, rol: "admin" } }

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(authOk)
  mockCanUseSku.mockResolvedValue({ ok: true, sku: "niche.tintoreria" })
})

describe("GET /api/niche/[appId]", () => {
  it("rechaza app desconocida", async () => {
    const res = await getNiche(new NextRequest("http://t/api/niche/foo"), {
      params: Promise.resolve({ appId: "foo" }),
    })
    expect(res.status).toBe(404)
  })

  it("rechaza sin SKU activo", async () => {
    mockCanUseSku.mockResolvedValue({ ok: false, sku: "niche.tintoreria" })
    const res = await getNiche(new NextRequest("http://t/api/niche/plancha"), {
      params: Promise.resolve({ appId: "plancha" }),
    })
    expect(res.status).toBe(403)
  })

  it("lista movimientos de plancha", async () => {
    mockListarMov.mockResolvedValue([{ id: 1, titulo: "Ticket 1" }])
    mockResumen.mockResolvedValue({ total: 1, pendientes: 1, pagados: 0, montoPendiente: 100, montoTotal: 100 })

    const res = await getNiche(new NextRequest("http://t/api/niche/plancha"), {
      params: Promise.resolve({ appId: "plancha" }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.movimientos).toHaveLength(1)
    expect(mockListarMov).toHaveBeenCalledWith(1, "niche.tintoreria")
  })
})

describe("POST /api/niche/[appId]", () => {
  it("crea movimiento ticket", async () => {
    mockCrearMov.mockResolvedValue({ id: 10, titulo: "Camisa", estado: "pendiente" })

    const res = await postNiche(
      new NextRequest("http://t/api/niche/plancha", {
        method: "POST",
        body: JSON.stringify({ titulo: "Camisa", monto: 5000, clienteId: 3 }),
      }),
      { params: Promise.resolve({ appId: "plancha" }) },
    )
    expect(res.status).toBe(200)
    expect(mockCrearMov).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ appSku: "niche.tintoreria", categoria: "ticket" }),
    )
  })

  it("plancha LISTO encola WhatsApp al cliente", async () => {
    mockActualizar.mockResolvedValue({
      id: 5,
      titulo: "Pantalón",
      monto: 3000,
      cliente: { id: 2, nombre: "Juan", telefono: "1155554444" },
    })
    mockEncolarWa.mockResolvedValue(true)

    const res = await postNiche(
      new NextRequest("http://t/api/niche/plancha", {
        method: "POST",
        body: JSON.stringify({ action: "marcar_estado", id: 5, estado: "listo" }),
      }),
      { params: Promise.resolve({ appId: "plancha" }) },
    )
    expect(res.status).toBe(200)
    expect(mockEncolarWa).toHaveBeenCalledWith(
      expect.objectContaining({ clienteNombre: "Juan", telefono: "1155554444" }),
    )
    const data = await res.json()
    expect(data.whatsappEncolado).toBe(true)
  })

  it("whatsapp masivo delega al servicio", async () => {
    mockCanUseSku.mockResolvedValue({ ok: true, sku: "niche.club_barrio" })
    mockWaMasivo.mockResolvedValue({ encolados: 2, omitidos: 0, total: 2 })

    const res = await postNiche(
      new NextRequest("http://t/api/niche/club", {
        method: "POST",
        body: JSON.stringify({ action: "whatsapp_masivo", mensaje: "Cuota pendiente" }),
      }),
      { params: Promise.resolve({ appId: "club" }) },
    )
    expect(res.status).toBe(200)
    expect(mockWaMasivo).toHaveBeenCalled()
  })
})

describe("/api/consorcios", () => {
  it("GET lista consorcios del tenant", async () => {
    mockListarCons.mockResolvedValue([{ id: 1, nombre: "Rivadavia" }])
    const res = await getConsorcios(new NextRequest("http://t/api/consorcios"))
    expect(res.status).toBe(200)
    expect(await res.json()).toHaveLength(1)
  })

  it("POST crea consorcio", async () => {
    mockCrearCons.mockResolvedValue({ id: 2, nombre: "Nuevo", direccion: "Calle 1" })
    const res = await postConsorcios(
      new NextRequest("http://t/api/consorcios", {
        method: "POST",
        body: JSON.stringify({ nombre: "Nuevo", direccion: "Calle 1" }),
      }),
    )
    expect(res.status).toBe(201)
    expect(mockCrearCons).toHaveBeenCalledWith(1, { nombre: "Nuevo", direccion: "Calle 1" })
  })
})

describe("POST /api/niche/clientes-rapido", () => {
  it("rechaza sin licencia nicho", async () => {
    mockCanUseSku.mockResolvedValue({ ok: false })
    const res = await postClienteRapido(
      new NextRequest("http://t/api/niche/clientes-rapido", {
        method: "POST",
        body: JSON.stringify({ nombre: "Ana", telefono: "1122334455" }),
      }),
    )
    expect(res.status).toBe(403)
  })

  it("crea cliente mínimo", async () => {
    mockCanUseSku.mockResolvedValueOnce({ ok: true, sku: "niche.consorcios" })
    mockClienteCreate.mockResolvedValue({ id: 99, nombre: "Ana", telefono: "1122334455" })

    const res = await postClienteRapido(
      new NextRequest("http://t/api/niche/clientes-rapido", {
        method: "POST",
        body: JSON.stringify({ nombre: "Ana", telefono: "1122334455" }),
      }),
    )
    expect(res.status).toBe(201)
    expect(mockClienteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nombre: "Ana", telefono: "1122334455", empresaId: 1 }),
      }),
    )
  })

  it("valida teléfono obligatorio", async () => {
    mockCanUseSku.mockResolvedValue({ ok: true, sku: "niche.club_barrio" })
    const res = await postClienteRapido(
      new NextRequest("http://t/api/niche/clientes-rapido", {
        method: "POST",
        body: JSON.stringify({ nombre: "Ana", telefono: "123" }),
      }),
    )
    expect(res.status).toBe(400)
  })
})