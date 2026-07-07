import { describe, expect, it, vi, beforeEach } from "vitest"
import { PACKS_CALLE } from "@/lib/comercial/pack-calle-catalog"
import {
  debeCorrerAlertaLiquidacion,
  periodoLiquidacionPendiente,
  runLiquidacionPendienteAlertas,
  runMorosoExpensaAlertas,
} from "@/lib/scheduling/jobs/consorcios-alertas"
import { generarLiquidacionConsorcioPDF } from "@/lib/printer/pdf-consorcio-service"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consorcio: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    consorcioGasto: { count: vi.fn().mockResolvedValue(0) },
    consorcioExpensa: { count: vi.fn().mockResolvedValue(0) },
    sistemaLog: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/consorcios/consorcios-morosos-service", () => ({
  listarMorososExpensas: vi.fn().mockResolvedValue([]),
  avisarMorosoExpensa: vi.fn().mockResolvedValue({ ok: true }),
  vencimientoExpensaDesdePeriodo: vi.fn(() => new Date(2026, 7, 10)),
}))

import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import {
  listarMorososExpensas,
  avisarMorosoExpensa,
} from "@/lib/consorcios/consorcios-morosos-service"

describe("INMO-P0 smoke — pool-propiedad vendible", () => {
  it("pool-propiedad está marcado vendibleHoy tras sprint P0", () => {
    const pack = PACKS_CALLE.find((p) => p.id === "pool-propiedad")
    expect(pack).toBeDefined()
    expect(pack!.vendibleHoy).toBe(true)
    expect(pack!.skus).toContain("niche.consorcios")
  })
})

describe("INMO-P0 smoke — PDF liquidación", () => {
  beforeEach(() => {
    vi.mocked(prisma.consorcio.findFirst).mockResolvedValue({
      id: 1,
      nombre: "Edificio Rivadavia",
      direccion: "Rivadavia 1200",
      cuit: null,
      empresaId: 10,
      empresa: {
        nombre: "Admin SA",
        razonSocial: "Admin SA",
        cuit: "30-12345678-9",
        direccion: "CABA",
      },
      gastos: [
        {
          id: 1,
          descripcion: "Luz ascensor",
          monto: 45_000,
          fecha: new Date("2026-07-01"),
          periodo: "2026-07",
        },
      ],
      unidades: [
        {
          id: 1,
          numero: "4B",
          porceps: 100,
          residente: { nombre: "García" },
          expensas: [
            {
              id: 1,
              montoTotal: 45_000,
              estado: "pendiente",
              periodo: "2026-07",
            },
          ],
        },
      ],
    } as never)
  })

  it("genera HTML con gastos, prorrateo y totales", async () => {
    const pdf = await generarLiquidacionConsorcioPDF(10, 1, "2026-07")
    expect(pdf.filename).toContain("2026-07")
    expect(pdf.html).toContain("Liquidación de expensas")
    expect(pdf.html).toContain("Luz ascensor")
    expect(pdf.html).toContain("4B")
    expect(pdf.html).toContain("García")
    expect(pdf.metadata.totalGastos).toBe(45_000)
    expect(pdf.metadata.unidades).toBe(1)
  })
})

describe("INMO-P0 smoke — crons alertas consorcio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.consorcio.findMany).mockResolvedValue([{ empresaId: 1 }] as never)
    vi.mocked(prisma.sistemaLog.findFirst).mockResolvedValue(null)
  })

  it("periodo liquidación pendiente es mes anterior", () => {
    expect(periodoLiquidacionPendiente(new Date(2026, 6, 3))).toBe("2026-06")
    expect(periodoLiquidacionPendiente(new Date(2026, 0, 2))).toBe("2025-12")
  })

  it("alerta liquidación solo corre día 1–5", () => {
    expect(debeCorrerAlertaLiquidacion(new Date(2026, 6, 3))).toBe(true)
    expect(debeCorrerAlertaLiquidacion(new Date(2026, 6, 7))).toBe(false)
  })

  it("morosos semanal encola WA y registra log", async () => {
    vi.mocked(listarMorososExpensas).mockResolvedValue([
      {
        expensaId: 99,
        periodo: "2026-06",
        monto: 50_000,
        estado: "pendiente",
        fechaVencimiento: "2026-07-10",
        diasMora: 15,
        unidadNumero: "2A",
        consorcioId: 1,
        consorcioNombre: "Torre",
        residenteId: 5,
        residenteNombre: "López",
        residenteTelefono: "1155551234",
      },
    ])

    const result = await runMorosoExpensaAlertas()
    expect(result.avisados).toBe(1)
    expect(avisarMorosoExpensa).toHaveBeenCalledWith(1, 99)
    expect(persistSistemaLog).toHaveBeenCalledWith(
      expect.objectContaining({ contexto: "consorcio.moroso_expensa" }),
    )
  })

  it("liquidación pendiente alerta admin si hay gastos sin expensas", async () => {
    vi.mocked(prisma.consorcio.findMany).mockResolvedValue([
      { id: 7, nombre: "Palermo 500", empresaId: 2 },
    ] as never)
    vi.mocked(prisma.consorcioGasto.count).mockResolvedValue(3)
    vi.mocked(prisma.consorcioExpensa.count).mockResolvedValue(0)

    const result = await runLiquidacionPendienteAlertas(new Date(2026, 6, 4))
    expect(result.skipped).toBe(false)
    expect(result.alertas).toBe(1)
    expect(persistSistemaLog).toHaveBeenCalledWith(
      expect.objectContaining({
        contexto: "consorcio.liquidacion_pendiente",
        empresaId: 2,
      }),
    )
  })
})