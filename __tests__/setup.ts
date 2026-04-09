/**
 * Vitest global setup
 * - Mocks Prisma client for unit tests (no DB required)
 * - Sets up common test utilities
 */

import { vi } from "vitest"

// ─── PRISMA MOCK ──────────────────────────────────────────────────────────────
// All tests run against a mock prisma client. For integration tests that need
// a real database, skip the mock and use a test database URL.

const mockPrismaClient: Record<string, any> = {}

const prismaModels = [
  "empresa", "cliente", "proveedor", "factura", "lineaFactura", "compra",
  "lineaCompra", "asientoContable", "movimientoContable", "categoria",
  "producto", "movimientoStock", "caja", "movimientoCaja", "notaCredito",
  "remito", "lineaRemito", "configuracionImpresora", "usuario",
  "configuracionFuncional", "handlerLog", "cuentaCobrar", "cuentaPagar",
  "recibo", "ordenPago", "stockDeposito", "profesional", "turno",
  "paciente", "consulta", "planMembresia", "membresia", "salon", "mesa",
  "comanda", "lineaComanda", "movimientoBancario", "logActividad",
  "cuentaContable", "configAsientoCuenta", "numerador", "parametroFiscal",
  // Sprint 11+ models
  "periodoFiscal", "configuracionModulo", "periodoIIBB",
  "presupuesto", "lineaPresupuesto", "activoFijo", "cotizacion", "centroCosto",
  "pedidoVenta", "lineaPedidoVenta", "ordenCompra", "lineaOrdenCompra",
  "recepcionCompra", "lineaRecepcionCompra", "listaPicking", "lineaPicking",
  "envio", "transportista", "deposito", "dispositivoIoT", "lecturaIoT", "alertaIoT",
  "listaMateriales", "componenteBOM", "ordenProduccion",
  "padronRegimenCliente", "retencionSICORE", "ticket", "comentarioTicket",
  "cheque", "cuentaBancaria", "puntoVentaConfig", "serie",
  "condicionPago", "formaPago", "listaPrecio", "itemListaPrecio",
  "vendedor", "moneda", "banco", "provincia", "localidad", "pais",
  "tipoCliente", "estadoCliente", "rubro", "canalVenta", "segmentoCliente",
  "zonaGeografica", "taxConcepto", "taxTasa", "cOT", "feriado",
  "itemRecibo", "itemOrdenPago", "transferenciaDeposito", "lineaTransferencia",
  "lote", "motivo", "inscripcionIIBB", "configFiscalEmpresa",
]

for (const model of prismaModels) {
  mockPrismaClient[model] = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  }
}

mockPrismaClient.$transaction = vi.fn(async (fn: any) => {
  if (typeof fn === "function") {
    return fn(mockPrismaClient)
  }
  return Promise.all(fn)
})

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrismaClient,
}))

export { mockPrismaClient }
