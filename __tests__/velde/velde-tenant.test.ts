/**
 * Velde: provision (sin AFIP) → 2 cajas → venta ticket en Corriente → stock + caja correcta,
 * sin CAE. Más: AFIP-off rechaza B, transferencia atómica, tenant sin cajaId sigue igual.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { createFakeDb } from "./fake-prisma"

vi.mock("@/lib/auth/empresa-guard", () => ({
  getAuthContext: vi.fn(),
  whereEmpresa: (empresaId: number, extra: Record<string, unknown> = {}) => ({ ...extra, empresaId }),
}))
vi.mock("@/lib/afip/solicitar-cae-factura", () => ({
  solicitarCaeFactura: vi.fn(async () => ({ ok: true, cae: "123", qrBase64: "", vencimientoCAE: "" })),
}))
vi.mock("@/lib/events/emit-domain-event", () => ({ emitFacturaEmitidaLegacy: vi.fn() }))
vi.mock("@/lib/pos/pos-afip-status", () => ({ obtenerEstadoAfipPos: vi.fn(async () => null) }))
vi.mock("@/lib/pos/pos-tipo-factura", () => ({
  resolverTipoCbtePos: vi.fn(async (_e: number, tipo: number) => tipo),
  letraDesdeTipoCbte: vi.fn(() => "B"),
}))
vi.mock("@/lib/fiado/fiado-service", () => ({
  validarFiadoPos: vi.fn(),
  incrementarDeudaCliente: vi.fn(),
  enviarNotificacionFiado: vi.fn(),
}))
vi.mock("@/lib/platform/entitlements", () => ({ canUseSku: vi.fn(async (_e: number, sku: string) => ({ ok: false, sku })) }))
vi.mock("@/lib/pos/pos-catalogo-grupos", () => ({ descontarStockCombo: vi.fn(async () => false) }))
vi.mock("@/lib/almacen-rosario/stock-cero-service", () => ({ registrarVentaStockCero: vi.fn() }))
vi.mock("@/lib/almacen-rosario/vale-dinero-service", () => ({ buscarValeActivo: vi.fn(), aplicarCobroVale: vi.fn() }))
vi.mock("@/lib/precios/resolver-precios-lineas", () => ({ resolverPreciosLineas: vi.fn() }))
vi.mock("@/lib/comercial/caps-ancla", () => ({
  anclaPuedeAbrirOtraCaja: vi.fn(async () => true),
  PAYLOAD_CAP_CAJA: { codigo: "CAP_SEGUNDA_CAJA" },
}))
vi.mock("@/lib/ops/tenant-plan-service", () => ({ setTenantPlan: vi.fn(async () => ({ id: "Pro", impersonacionErp: true })) }))

import { getAuthContext } from "@/lib/auth/empresa-guard"
import { solicitarCaeFactura } from "@/lib/afip/solicitar-cae-factura"
import { setTenantPlan } from "@/lib/ops/tenant-plan-service"
import { prisma } from "@/lib/prisma"
import { invalidateConfigCache } from "@/lib/config/parametro-service"
import { provisionVelde, VELDE_CUIT } from "@/lib/provisioning/provision-velde"
import { POST as abrirCaja } from "@/app/api/caja/route"
import { POST as venta } from "@/app/api/pos/venta/route"
import { POST as transferencia } from "@/app/api/caja/transferencia/route"

const authAs = (empresaId: number) =>
  vi.mocked(getAuthContext).mockResolvedValue({
    ok: true,
    auth: { userId: 1, email: "owner@test.local", rol: "administrador", empresaId },
  } as never)

const post = (url: string, body: unknown) =>
  new NextRequest(`http://test.local${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

const ventaBody = (extra: Record<string, unknown>) => ({
  tipoFactura: "ticket",
  usarListaPrecios: false,
  lineas: [{ productoId: 1, descripcion: "Producto", cantidad: 2, precioUnitario: 500, porcentajeIva: 21 }],
  pagos: [{ medio: "efectivo", monto: 1000 }],
  ...extra,
})

let fake: ReturnType<typeof createFakeDb>

beforeEach(() => {
  vi.clearAllMocks()
  invalidateConfigCache()
  fake = createFakeDb()
})

async function provisionarYAbrirCajas() {
  const prov = await provisionVelde()
  authAs(prov.empresaId)
  const [corrienteTipo, ahorroTipo] = prov.cajaTipos
  const r1 = await abrirCaja(post("/api/caja", { saldoInicial: 0, cajaTipoId: corrienteTipo.id }))
  const r2 = await abrirCaja(post("/api/caja", { saldoInicial: 0, cajaTipoId: ahorroTipo.id }))
  expect(r1.status).toBe(201)
  expect(r2.status).toBe(201)
  const corriente = (await r1.json()) as { id: number }
  const ahorro = (await r2.json()) as { id: number }
  fake.insert("producto", { empresaId: prov.empresaId, nombre: "Producto", stock: 10 })
  return { prov, corriente, ahorro }
}

describe("provisionVelde", () => {
  it("es idempotente, deja AFIP off, 2 CajaTipo, core.claver, plan Pro y no crea usuarios", async () => {
    const a = await provisionVelde()
    const b = await provisionVelde()
    expect(b.empresaId).toBe(a.empresaId)
    expect(a.empresaCreada).toBe(true)
    expect(b.empresaCreada).toBe(false)
    expect(fake.table("empresa")).toHaveLength(1)
    expect(fake.table("empresa")[0]).toMatchObject({ cuit: VELDE_CUIT, nombre: "Velde", rubro: "comercio", modoLite: "pos" })
    expect(fake.table("cajaTipo").map((t) => [t.codigo, t.nombre])).toEqual([
      ["CORRIENTE", "Corriente"],
      ["AHORRO", "Ahorro"],
    ])
    expect(fake.table("featureEmpresa")).toEqual([
      expect.objectContaining({ empresaId: a.empresaId, featureKey: "facturacion_afip", activado: false }),
      expect.objectContaining({ empresaId: a.empresaId, featureKey: "caja_seleccion_obligatoria", activado: true }),
    ])
    expect(fake.table("parametroFiscal").find((p) => p.clave === "fiscal_modo_comprobante")?.valor).toBe(3)
    expect(fake.table("suscripcionModulo")).toEqual([
      expect.objectContaining({ sku: "core.claver", activo: true, vigenciaHasta: null }),
    ])
    expect(fake.table("cliente")).toHaveLength(1)
    expect(setTenantPlan).toHaveBeenCalledWith(a.empresaId, "Pro")
    expect(prisma.usuario.create).not.toHaveBeenCalled()
    expect(prisma.analistaAsignacion.create).not.toHaveBeenCalled()
    expect(prisma.analistaAsignacion.upsert).not.toHaveBeenCalled()
  })
})

describe("Velde happy path", () => {
  it("venta ticket con cajaId Corriente → stock, MovimientoStock y MovimientoCaja en Corriente, sin CAE", async () => {
    const { prov, corriente, ahorro } = await provisionarYAbrirCajas()

    const res = await venta(post("/api/pos/venta", ventaBody({ cajaId: corriente.id })))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.estado).toBe("ticket")

    expect(fake.table("producto")[0].stock).toBe(8)
    expect(fake.table("movimientoStock")).toEqual([
      expect.objectContaining({ empresaId: prov.empresaId, productoId: 1, tipo: "salida", cantidad: 2 }),
    ])
    const movs = fake.table("movimientoCaja")
    expect(movs).toHaveLength(1)
    expect(movs[0]).toMatchObject({ cajaId: corriente.id, tipo: "ingreso", monto: 1000 })
    expect(movs.some((m) => m.cajaId === ahorro.id)).toBe(false)
    expect(solicitarCaeFactura).not.toHaveBeenCalled()
  })

  it("AFIP off rechaza factura B con 400 y no toca stock/caja/CAE", async () => {
    await provisionarYAbrirCajas()
    const corriente = fake.table("caja")[0]
    const res = await venta(post("/api/pos/venta", ventaBody({ tipoFactura: "B", cajaId: corriente.id })))
    expect(res.status).toBe(400)
    expect((await res.json()).codigo).toBe("AFIP_DESHABILITADO")
    expect(fake.table("factura")).toHaveLength(0)
    expect(fake.table("movimientoCaja")).toHaveLength(0)
    expect(solicitarCaeFactura).not.toHaveBeenCalled()
  })

  it("Velde (flag on), 2 cajas abiertas y sin cajaId → 409 CAJA_REQUERIDA", async () => {
    await provisionarYAbrirCajas()
    const res = await venta(post("/api/pos/venta", ventaBody({})))
    expect(res.status).toBe(409)
    expect((await res.json()).codigo).toBe("CAJA_REQUERIDA")
  })

  it("no permite abrir dos veces la misma CajaTipo", async () => {
    const { prov } = await provisionarYAbrirCajas()
    const res = await abrirCaja(post("/api/caja", { saldoInicial: 0, cajaTipoId: prov.cajaTipos[0].id }))
    expect(res.status).toBe(409)
  })

  it("cajaId de otra empresa → 400; caja cerrada → 409", async () => {
    await provisionarYAbrirCajas()
    const ajena = fake.insert("caja", { empresaId: 999 })
    const r1 = await venta(post("/api/pos/venta", ventaBody({ cajaId: ajena.id })))
    expect(r1.status).toBe(400)
    const cerrada = fake.insert("caja", { empresaId: fake.table("empresa")[0].id, estado: "cerrada" })
    const r2 = await venta(post("/api/pos/venta", ventaBody({ cajaId: cerrada.id })))
    expect(r2.status).toBe(409)
  })

  it("transferencia Corriente → Ahorro: egreso + ingreso en una transacción", async () => {
    const { corriente, ahorro } = await provisionarYAbrirCajas()
    const res = await transferencia(
      post("/api/caja/transferencia", { origenCajaId: corriente.id, destinoCajaId: ahorro.id, monto: 300 }),
    )
    expect(res.status).toBe(201)
    const movs = fake.table("movimientoCaja")
    expect(movs).toEqual([
      expect.objectContaining({ cajaId: corriente.id, tipo: "egreso", monto: 300 }),
      expect.objectContaining({ cajaId: ahorro.id, tipo: "ingreso", monto: 300 }),
    ])
    expect(movs[0].referencia).toBe(movs[1].referencia)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it("transferencia: si falla el ingreso, no queda el egreso (rollback)", async () => {
    const { corriente, ahorro } = await provisionarYAbrirCajas()
    const create = vi.mocked(prisma.movimientoCaja.create)
    const impl = create.getMockImplementation()!
    create.mockImplementationOnce(impl).mockImplementationOnce(async () => {
      throw new Error("DB caída")
    })
    const res = await transferencia(
      post("/api/caja/transferencia", { origenCajaId: corriente.id, destinoCajaId: ahorro.id, monto: 300 }),
    )
    expect(res.status).toBe(500)
    expect(fake.table("movimientoCaja")).toHaveLength(0)
  })

  it("transferencia rechaza monto <= 0 y cajas de otra empresa", async () => {
    const { corriente } = await provisionarYAbrirCajas()
    const r0 = await transferencia(post("/api/caja/transferencia", { origenCajaId: corriente.id, destinoCajaId: 77, monto: 0 }))
    expect(r0.status).toBe(400)
    const ajena = fake.insert("caja", { empresaId: 999 })
    const r1 = await transferencia(post("/api/caja/transferencia", { origenCajaId: corriente.id, destinoCajaId: ajena.id, monto: 10 }))
    expect(r1.status).toBe(404)
    expect(fake.table("movimientoCaja")).toHaveLength(0)
  })
})

describe("otros tenants sin cambios", () => {
  it("REGRESIÓN: tenant SIN flag, 2 cajas abiertas, sin cajaId → 201 en la caja que da findFirst (como main)", async () => {
    const primera = fake.insert("caja", { empresaId: 52 })
    const segunda = fake.insert("caja", { empresaId: 52 })
    fake.insert("cliente", { empresaId: 52, nombre: "Consumidor Final" })
    fake.insert("producto", { empresaId: 52, nombre: "Producto", stock: 5 })
    authAs(52)
    const res = await venta(post("/api/pos/venta", ventaBody({})))
    expect(res.status).toBe(201)
    // misma query que main
    expect(prisma.caja.findFirst).toHaveBeenCalledWith({ where: { empresaId: 52, estado: "abierta" } })
    expect(prisma.caja.count).not.toHaveBeenCalled()
    const movs = fake.table("movimientoCaja")
    expect(movs).toHaveLength(1)
    expect(movs[0]).toMatchObject({ cajaId: primera.id, tipo: "ingreso" })
    expect(movs.some((m) => m.cajaId === segunda.id)).toBe(false)
  })

  it("tenant ticket_solo SIN flag, 2 cajas abiertas, sin cajaId → 201 (gate no atado a ticket_solo)", async () => {
    fake.insert("parametroFiscal", { empresaId: 53, clave: "fiscal_modo_comprobante", valor: 3 })
    const primera = fake.insert("caja", { empresaId: 53 })
    fake.insert("caja", { empresaId: 53 })
    fake.insert("cliente", { empresaId: 53, nombre: "Consumidor Final" })
    fake.insert("producto", { empresaId: 53, nombre: "Producto", stock: 5 })
    authAs(53)
    const res = await venta(post("/api/pos/venta", ventaBody({})))
    expect(res.status).toBe(201)
    expect(fake.table("movimientoCaja")[0]).toMatchObject({ cajaId: primera.id })
  })

  it("tenant con 1 caja y sin cajaId sigue vendiendo en esa caja", async () => {
    const caja = fake.insert("caja", { empresaId: 50 })
    fake.insert("cliente", { empresaId: 50, nombre: "Consumidor Final" })
    fake.insert("producto", { empresaId: 50, nombre: "Producto", stock: 5 })
    authAs(50)
    const res = await venta(post("/api/pos/venta", ventaBody({})))
    expect(res.status).toBe(201)
    expect(fake.table("movimientoCaja")[0]).toMatchObject({ cajaId: caja.id, tipo: "ingreso" })
  })

  it("tenant con AFIP (sin override) sigue pidiendo CAE en factura B", async () => {
    fake.insert("caja", { empresaId: 51 })
    fake.insert("cliente", { empresaId: 51, nombre: "Consumidor Final" })
    fake.insert("producto", { empresaId: 51, nombre: "Producto", stock: 5 })
    authAs(51)
    const res = await venta(post("/api/pos/venta", ventaBody({ tipoFactura: "B" })))
    expect(res.status).toBe(201)
    expect(solicitarCaeFactura).toHaveBeenCalledTimes(1)
  })
})
