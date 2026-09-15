import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  parseOficioSenaRef,
  isOficioSenaRef,
  aplicarSenaOficioDesdeMp,
} from "@/lib/oficios/aplicar-sena-mp"

describe("oficio sena MP refs", () => {
  it("parsea OFICIO_SENA_{uuid}", () => {
    expect(parseOficioSenaRef("OFICIO_SENA_abc-123")).toEqual({ trabajoId: "abc-123" })
    expect(isOficioSenaRef("OFICIO_SENA_x")).toBe(true)
    expect(isOficioSenaRef("fiado-1-2")).toBe(false)
    expect(parseOficioSenaRef("OFICIO_SENA_")).toBeNull()
  })
})

describe("aplicarSenaOficioDesdeMp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (!mockPrismaClient.oficioTrabajo) {
      mockPrismaClient.oficioTrabajo = {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      }
    }
  })

  it("happy path: marca senaPagada y crea movimiento caja", async () => {
    mockPrismaClient.mercadoPagoTransaccion.findUnique.mockResolvedValue({
      id: 10,
      conciliado: false,
      empresaId: 1,
      estado: "approved",
    })
    mockPrismaClient.oficioTrabajo.findFirst.mockResolvedValue({
      id: "trab-1",
      titulo: "Instalación termotanque",
      senaPagada: false,
      mpPaymentIdSena: null,
      estado: "PRESUPUESTADO",
    })
    mockPrismaClient.oficioTrabajo.update.mockResolvedValue({})
    mockPrismaClient.mercadoPagoTransaccion.update.mockResolvedValue({})
    mockPrismaClient.caja.findFirst.mockResolvedValue({ id: 55 })
    mockPrismaClient.movimientoCaja.create.mockResolvedValue({ id: 901 })

    const r = await aplicarSenaOficioDesdeMp({
      empresaId: 1,
      transaccionId: 10,
      externalRef: "OFICIO_SENA_trab-1",
      monto: 15000,
      mpPaymentId: "pay_mp_99",
    })

    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.senaPagada).toBe(true)
      expect(r.trabajoId).toBe("trab-1")
      expect(r.movimientoId).toBe(901)
      expect(r.skipped).toBeUndefined()
    }

    expect(mockPrismaClient.oficioTrabajo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "trab-1" },
        data: expect.objectContaining({
          senaPagada: true,
          mpPaymentIdSena: "pay_mp_99",
          estado: "CONFIRMADO",
          medioPagoFinal: "mercadopago",
        }),
      }),
    )
    expect(mockPrismaClient.movimientoCaja.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cajaId: 55,
          tipo: "ingreso",
          monto: 15000,
          medioPago: "tarjeta_credito",
        }),
      }),
    )
    expect(mockPrismaClient.mercadoPagoTransaccion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({ conciliado: true }),
      }),
    )
  })

  it("idempotente si senaPagada ya true", async () => {
    mockPrismaClient.mercadoPagoTransaccion.findUnique.mockResolvedValue({
      id: 11,
      conciliado: false,
      empresaId: 1,
      estado: "approved",
    })
    mockPrismaClient.oficioTrabajo.findFirst.mockResolvedValue({
      id: "trab-1",
      titulo: "x",
      senaPagada: true,
      mpPaymentIdSena: "pay_old",
      estado: "CONFIRMADO",
    })
    mockPrismaClient.mercadoPagoTransaccion.update.mockResolvedValue({})

    const r = await aplicarSenaOficioDesdeMp({
      empresaId: 1,
      transaccionId: 11,
      externalRef: "OFICIO_SENA_trab-1",
      monto: 15000,
      mpPaymentId: "pay_new",
    })

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.skipped).toBe(true)
    expect(mockPrismaClient.movimientoCaja.create).not.toHaveBeenCalled()
  })

  it("fail closed si pago no approved", async () => {
    mockPrismaClient.mercadoPagoTransaccion.findUnique.mockResolvedValue({
      id: 12,
      conciliado: false,
      empresaId: 1,
      estado: "pending",
    })

    const r = await aplicarSenaOficioDesdeMp({
      empresaId: 1,
      transaccionId: 12,
      externalRef: "OFICIO_SENA_trab-1",
      monto: 15000,
      mpPaymentId: "pay_x",
    })

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/no aprobado/i)
  })
})
