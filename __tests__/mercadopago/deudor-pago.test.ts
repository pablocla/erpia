import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  buildFiadoPagoExternalRef,
  parseDeudorPagoRef,
  isDeudorPagoRef,
} from "@/lib/mercadopago/deudor-pago-ref"

vi.mock("@/lib/fiado/fiado-service", () => ({
  cobrarFiadoLibreta: vi.fn().mockResolvedValue({
    ok: true,
    reciboId: 99,
    reciboNumero: "REC-FIADO-000099",
    cuentasAplicadas: [7],
    clienteId: 3,
    monto: 1500,
    deudaRestante: 0,
  }),
}))

vi.mock("@/lib/cobros/cobros-service", () => ({
  cobrosService: {
    registrarCobro: vi.fn().mockResolvedValue({
      reciboId: 88,
      reciboNumero: "REC-000088",
      montoTotal: 1500,
      totalRetenciones: 0,
      netoRecibido: 1500,
    }),
  },
}))

import { aplicarPagoDeudorDesdeMp } from "@/lib/mercadopago/aplicar-pago-deudor"
import { cobrarFiadoLibreta } from "@/lib/fiado/fiado-service"

describe("deudor-pago-ref", () => {
  it("parsea fiado legacy y con cc/empresa", () => {
    expect(parseDeudorPagoRef("fiado-10-3")).toEqual({
      kind: "fiado",
      facturaId: 10,
      clienteId: 3,
      cuentaCobrarId: undefined,
    })
    expect(parseDeudorPagoRef("fiado-0-3-cc-7-e1")).toEqual({
      kind: "fiado",
      facturaId: 0,
      clienteId: 3,
      cuentaCobrarId: 7,
    })
    expect(parseDeudorPagoRef("cxc-42").kind).toBe("cxc")
    expect(parseDeudorPagoRef("cobro-cc-42")).toEqual({ kind: "cxc", cuentaCobrarId: 42 })
    expect(parseDeudorPagoRef("fac-9").kind).toBe("fac")
    expect(isDeudorPagoRef("claver-empresa-1-sku-core")).toBe(false)
  })

  it("buildFiadoPagoExternalRef es parseable", () => {
    const ref = buildFiadoPagoExternalRef({
      empresaId: 1,
      clienteId: 3,
      facturaId: 0,
      cuentaCobrarId: 7,
    })
    expect(ref).toBe("fiado-0-3-cc-7-e1")
    expect(parseDeudorPagoRef(ref).kind).toBe("fiado")
  })
})

describe("aplicarPagoDeudorDesdeMp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("idempotente si ya conciliado", async () => {
    mockPrismaClient.mercadoPagoTransaccion.findUnique.mockResolvedValue({
      id: 1,
      conciliado: true,
      empresaId: 1,
      estado: "approved",
    })

    const r = await aplicarPagoDeudorDesdeMp({
      empresaId: 1,
      transaccionId: 1,
      externalRef: "fiado-0-3-e1",
      monto: 1500,
      mpPaymentId: "pay_1",
    })

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.skipped).toBe(true)
    expect(cobrarFiadoLibreta).not.toHaveBeenCalled()
  })

  it("aplica cobro fiado y marca conciliado", async () => {
    mockPrismaClient.mercadoPagoTransaccion.findUnique.mockResolvedValue({
      id: 2,
      conciliado: false,
      empresaId: 1,
      estado: "approved",
    })
    mockPrismaClient.cliente.findFirst.mockResolvedValue({ id: 3 })
    mockPrismaClient.mercadoPagoTransaccion.update.mockResolvedValue({})

    const r = await aplicarPagoDeudorDesdeMp({
      empresaId: 1,
      transaccionId: 2,
      externalRef: "fiado-0-3-cc-7-e1",
      monto: 1500,
      mpPaymentId: "pay_2",
    })

    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.reciboId).toBe(99)
      expect(r.skipped).toBeUndefined()
    }
    expect(cobrarFiadoLibreta).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 1,
        clienteId: 3,
        monto: 1500,
        medioPago: "tarjeta",
      }),
    )
    expect(mockPrismaClient.mercadoPagoTransaccion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: expect.objectContaining({ conciliado: true }),
      }),
    )
  })
})
