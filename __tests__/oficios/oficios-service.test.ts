import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  createTrabajo,
  aprobarPresupuestoPublico,
  type CreateTrabajoDTO,
} from "@/lib/oficios/oficios-service"
import { liquidarSemanaOperario } from "@/lib/oficios/cuadrilla-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    oficioTrabajo: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    oficioOperario: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    oficioAsignacion: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe("Claver Oficios & Obras — Services", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("crea un trabajo de oficio con estructura de presupuesto 3 niveles", async () => {
    const dto: CreateTrabajoDTO = {
      tipoOficio: "PLOMERIA_GAS",
      titulo: "Instalación Termotanque 80L",
      direccion: "Av. Colón 1234, Córdoba",
      porcentajeSena: 30,
      opcionesPresupuesto: {
        moneda: "ARS",
        validezDias: 7,
        porcentajeSena: 30,
        opciones: [
          {
            nombre: "Básico",
            nivel: "basico",
            descripcion: "Básico",
            items: [{ concepto: "Mano de obra", cantidad: 1, unidad: "gl", precioUnitario: 30000, subtotal: 30000 }],
            total: 30000,
            plazoEstimadoDias: 1,
            garantiaMeses: 3,
          },
          {
            nombre: "Recomendado",
            nivel: "recomendado",
            descripcion: "Recomendado",
            items: [{ concepto: "Mano de obra + kit", cantidad: 1, unidad: "gl", precioUnitario: 50000, subtotal: 50000 }],
            total: 50000,
            plazoEstimadoDias: 1,
            garantiaMeses: 6,
          },
        ],
      },
    }

    vi.mocked(prisma.oficioTrabajo.create).mockResolvedValueOnce({
      id: "trabajo-uuid-1",
      empresaId: 1,
      clienteId: null,
      tokenPublico: "token-publico-123",
      numero: 101,
      tipoOficio: "PLOMERIA_GAS",
      titulo: dto.titulo,
      descripcion: null,
      direccion: dto.direccion || null,
      ubicacionGps: null,
      fechaPactada: null,
      estado: "PRESUPUESTADO",
      opcionesPresupuesto: dto.opcionesPresupuesto as any,
      opcionElegida: null,
      montoAcordado: null,
      porcentajeSena: 30,
      validezDias: 7,
      mpPreferenceIdSena: null,
      mpPaymentIdSena: null,
      senaPagada: false,
      mpPreferenceIdSaldo: null,
      mpPaymentIdSaldo: null,
      saldoPagado: false,
      medioPagoFinal: null,
      fotosAntes: [],
      fotosDespues: [],
      firmaClienteUrl: null,
      calificacionEstrellas: null,
      resenaComentario: null,
      garantiaHasta: null,
      proximoServiceMeses: null,
      fechaProximoService: null,
      alertaServiceEnviada: false,
      ventaId: null,
      cuentaCorrienteId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const trabajo = await createTrabajo(1, dto)
    expect(trabajo.id).toBe("trabajo-uuid-1")
    expect(trabajo.titulo).toBe("Instalación Termotanque 80L")
    expect(trabajo.porcentajeSena).toBe(30)
  })

  it("calcula liquidación semanal de jornales para operario", async () => {
    vi.mocked(prisma.oficioOperario.findFirst).mockResolvedValueOnce({
      id: "op-1",
      empresaId: 1,
      nombre: "Carlos Gómez",
      telefono: "1123456789",
      rol: "Oficial",
      valorJornal: 35000 as any,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    vi.mocked(prisma.oficioAsignacion.findMany).mockResolvedValueOnce([
      { id: "as-1", operarioId: "op-1", fecha: new Date(), trabajo: { titulo: "Obra 1", direccion: "Calle 1" } },
      { id: "as-2", operarioId: "op-1", fecha: new Date(), trabajo: { titulo: "Obra 2", direccion: "Calle 2" } },
      { id: "as-3", operarioId: "op-1", fecha: new Date(), trabajo: { titulo: "Obra 3", direccion: "Calle 3" } },
    ] as any)

    const liq = await liquidarSemanaOperario(1, "op-1", new Date(), new Date())
    expect(liq.diasTrabajados).toBe(3)
    expect(liq.totalBruto).toBe(105000)
    expect(liq.netoAPagar).toBe(105000)
  })
})
