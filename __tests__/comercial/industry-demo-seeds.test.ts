import { describe, it, expect, vi, beforeEach } from "vitest"
import { seedIndustryDemoData } from "@/lib/comercial/industry-demo-seeds"
import { getIndustryTemplate } from "@/lib/comercial/industry-templates"
import { prisma } from "@/lib/prisma"

describe("industry-demo-seeds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("habilita fiado con saldo negativo en almacén", async () => {
    const template = getIndustryTemplate("almacen")!
    vi.mocked(prisma.producto.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.producto.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.cliente.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    vi.mocked(prisma.cliente.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.empresa.update).mockResolvedValue({ id: 1 } as never)

    const result = await seedIndustryDemoData(99, template)

    expect(result.clientes).toBeGreaterThan(0)
    expect(prisma.empresa.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 99 },
        data: expect.objectContaining({ fiadoRequiereLimite: false }),
      }),
    )
    expect(prisma.cliente.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fiadoHabilitado: true,
          saldoCuentaCorriente: -8500,
        }),
      }),
    )
  })

  it("siembra salón, mesas y comanda para bar", async () => {
    const template = getIndustryTemplate("bar_restaurant")!
    vi.mocked(prisma.producto.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.producto.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.cliente.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.cliente.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.salon.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.salon.create).mockResolvedValue({ id: 10, nombre: "Salón principal" } as never)
    vi.mocked(prisma.mesa.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.mesa.create).mockImplementation(async ({ data }) => ({
      id: data.numero,
      ...data,
    }) as never)
    vi.mocked(prisma.comanda.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.comanda.create).mockResolvedValue({ id: 1 } as never)

    const result = await seedIndustryDemoData(99, template)

    expect(result.mesas).toBe(6)
    expect(result.comandas).toBe(1)
    expect(prisma.comanda.create).toHaveBeenCalled()
  })

  it("siembra planes y membresías para gimnasio", async () => {
    const template = getIndustryTemplate("gimnasio")!
    vi.mocked(prisma.producto.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.producto.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.cliente.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, nombre: "Ana Martínez — Cuota Pilates" } as never)
      .mockResolvedValue({ id: 2, nombre: "Diego López — Plan mensual" } as never)
    vi.mocked(prisma.cliente.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.planMembresia.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.planMembresia.create).mockImplementation(async ({ data }) => ({
      id: 1,
      duracionDias: data.duracionDias,
      nombre: data.nombre,
    }) as never)
    vi.mocked(prisma.membresia.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.membresia.create).mockResolvedValue({ id: 1 } as never)

    const result = await seedIndustryDemoData(99, template)

    expect(result.planes).toBe(3)
    expect(result.membresias).toBeGreaterThan(0)
  })

  it("siembra perfil REPROCANN, sala, ciclo e insumos para cultivo regulado", async () => {
    const template = getIndustryTemplate("agro_cannabis")!
    vi.mocked(prisma.producto.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.producto.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.cliente.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.cliente.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.agroCannabisPerfil.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.agroCannabisPerfil.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.agroCannabisSala.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.agroCannabisSala.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.agroCannabisGenetica.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.agroCannabisGenetica.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.agroCannabisCiclo.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.agroCannabisCiclo.create).mockResolvedValue({ id: 1 } as never)
    vi.mocked(prisma.agroCannabisInsumo.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.agroCannabisInsumo.create).mockResolvedValue({ id: 1 } as never)

    const result = await seedIndustryDemoData(99, template)

    expect(result.cannabis).toBe(true)
    expect(prisma.agroCannabisPerfil.create).toHaveBeenCalled()
    expect(prisma.agroCannabisCiclo.create).toHaveBeenCalled()
    expect(prisma.agroCannabisInsumo.create).toHaveBeenCalled()
  })
})