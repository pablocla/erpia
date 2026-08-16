import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  listarMaquinarias,
  crearMaquinaria,
  listarContratosAlquiler,
  crearContratoAlquiler,
  devolverMaquinariaContrato,
} from "@/lib/oficios/alquiler-maquinaria-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oficioMaquinaria: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    oficioAlquilerContrato: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}))

describe("Alquiler Maquinaria Service", () => {
  const empresaId = 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("crearMaquinaria registra un equipo en el pañol", async () => {
    const mockMaq = {
      id: "maq-1",
      empresaId,
      codigo: "AND-01",
      nombre: "Andamio Tubular 6 Cuerpos",
      tarifaDiaria: 15000,
      estado: "DISPONIBLE",
    }
    vi.mocked(prisma.oficioMaquinaria.create).mockResolvedValue(mockMaq as any)

    const res = await crearMaquinaria(empresaId, {
      codigo: "and-01",
      nombre: "Andamio Tubular 6 Cuerpos",
      tarifaDiaria: 15000,
    })

    expect(res.codigo).toBe("AND-01")
    expect(res.nombre).toBe("Andamio Tubular 6 Cuerpos")
  })

  it("crearContratoAlquiler crea contrato y marca la máquina como ALQUILADA", async () => {
    const mockContrato = {
      id: "cont-1",
      empresaId,
      clienteId: 2,
      maquinariaId: "maq-1",
      montoPactado: 45000,
      estado: "ACTIVO",
    }
    vi.mocked(prisma.oficioAlquilerContrato.create).mockResolvedValue(mockContrato as any)
    vi.mocked(prisma.oficioMaquinaria.update).mockResolvedValue({ id: "maq-1", estado: "ALQUILADO" } as any)

    const res = await crearContratoAlquiler(empresaId, {
      clienteId: 2,
      maquinariaId: "maq-1",
      fechaPactadaDevolucion: new Date(Date.now() + 86400000 * 3),
      montoPactado: 45000,
    })

    expect(res.estado).toBe("ACTIVO")
    expect(prisma.oficioMaquinaria.update).toHaveBeenCalledWith({
      where: { id: "maq-1" },
      data: { estado: "ALQUILADO" },
    })
  })

  it("devolverMaquinariaContrato libera el equipo a DISPONIBLE", async () => {
    vi.mocked(prisma.oficioAlquilerContrato.findFirst).mockResolvedValue({
      id: "cont-1",
      empresaId,
      maquinariaId: "maq-1",
      montoPactado: 45000,
    } as any)
    vi.mocked(prisma.oficioAlquilerContrato.update).mockResolvedValue({
      id: "cont-1",
      estado: "DEVUELTO",
    } as any)
    vi.mocked(prisma.oficioMaquinaria.update).mockResolvedValue({ id: "maq-1", estado: "DISPONIBLE" } as any)

    const res = await devolverMaquinariaContrato(empresaId, "cont-1", {
      cargosExtras: 0,
      observacionesDevolucion: "Devuelto limpio",
    })

    expect(res.estado).toBe("DEVUELTO")
    expect(prisma.oficioMaquinaria.update).toHaveBeenCalledWith({
      where: { id: "maq-1" },
      data: { estado: "DISPONIBLE" },
    })
  })
})
