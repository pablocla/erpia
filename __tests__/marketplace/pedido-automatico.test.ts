import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { procesarPedidosAutomaticosProveedores } from "@/lib/marketplace/pedido-automatico-service"

// Mock the JIT proposals service to return static proposals
vi.mock("@/lib/marketplace/reponedor-jit-service", () => ({
  generarPropuestasReposicion: vi.fn().mockResolvedValue([
    {
      productoId: 101,
      codigo: "PROD1",
      nombre: "Yerba Mate Taragui 1kg",
      stockActual: 2,
      stockMinimo: 10,
      velocidadDiaria: 1.5,
      cantidadSugerida: 20,
      diasCobertura: 1.3,
      urgencia: "alta",
    },
    {
      productoId: 102,
      codigo: "PROD2",
      nombre: "Azúcar Ledesma 1kg",
      stockActual: 1,
      stockMinimo: 5,
      velocidadDiaria: 0.8,
      cantidadSugerida: 10,
      diasCobertura: 1.2,
      urgencia: "alta",
    },
  ]),
}))

describe("procesarPedidosAutomaticosProveedores", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock lookups for Supplier (Proveedor)
    mockPrismaClient.lineaOrdenCompra = {
      findFirst: vi.fn().mockResolvedValue({
        id: 1,
        ordenCompra: {
          id: 50,
          numero: "00000045",
          proveedor: {
            id: 201,
            nombre: "Distribuidora Rosario",
            cuit: "30-11111111-9",
            telefono: "+543419999999",
            activo: true,
          },
        },
      }),
    }

    mockPrismaClient.lineaCompra = {
      findFirst: vi.fn().mockResolvedValue(null),
    }

    mockPrismaClient.proveedor = {
      findFirst: vi.fn().mockResolvedValue({
        id: 201,
        nombre: "Distribuidora Rosario",
        cuit: "30-11111111-9",
        telefono: "+543419999999",
        activo: true,
      }),
    }

    mockPrismaClient.empresa = {
      findUnique: vi.fn().mockResolvedValue({
        id: 1,
        nombre: "Almacen El Paso",
      }),
    }

    mockPrismaClient.producto = {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 101) {
          return Promise.resolve({ id: 101, precioCompra: 500, unidad: "unidad" })
        }
        if (where.id === 102) {
          return Promise.resolve({ id: 102, precioCompra: 300, unidad: "unidad" })
        }
        return Promise.resolve(null)
      }),
    }

    mockPrismaClient.ordenCompra = {
      findFirst: vi.fn().mockResolvedValue({
        id: 49,
        numero: "00000010",
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 51,
          numero: data.numero,
          ...data,
        })
      }),
    }

    mockPrismaClient.mensajePendienteWhatsApp = {
      create: vi.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 88,
          ...data,
        })
      }),
    }
  })

  it("consolida propuestas de stock bajo por proveedor, genera la Orden de Compra y encola el WhatsApp", async () => {
    const res = await procesarPedidosAutomaticosProveedores(1)

    // Verify returning summary
    expect(res.ordenesCreadas).toBe(1)
    expect(res.mensajesEncolados).toBe(1)
    expect(res.detalles.length).toBe(1)

    const d = res.detalles[0]
    expect(d.proveedorId).toBe(201)
    expect(d.proveedorNombre).toBe("Distribuidora Rosario")
    expect(d.ordenNumero).toBe("00000011") // Increment of 00000010
    expect(d.totalProductos).toBe(2)
    expect(d.mensajeId).toBe(88)
    expect(d.telefonoDestino).toBe("+543419999999")

    // Check OrdenCompra creation params
    expect(mockPrismaClient.ordenCompra.create).toHaveBeenCalledTimes(1)
    const createOcCall = mockPrismaClient.ordenCompra.create.mock.calls[0][0]
    expect(createOcCall.data.numero).toBe("00000011")
    expect(createOcCall.data.estado).toBe("borrador")
    expect(createOcCall.data.proveedorId).toBe(201)
    // 20 * 500 = 10000; 10 * 300 = 3000; subtotal = 13000
    expect(Number(createOcCall.data.subtotal)).toBe(13000)
    expect(Number(createOcCall.data.total)).toBe(13000 * 1.21)

    // Check Lineas creation
    expect(createOcCall.data.lineas.create.length).toBe(2)
    expect(createOcCall.data.lineas.create[0].productoId).toBe(101)
    expect(Number(createOcCall.data.lineas.create[0].cantidad)).toBe(20)

    // Check WhatsApp queueing
    expect(mockPrismaClient.mensajePendienteWhatsApp.create).toHaveBeenCalledTimes(1)
    const waCall = mockPrismaClient.mensajePendienteWhatsApp.create.mock.calls[0][0]
    expect(waCall.data.telefono).toBe("+543419999999")
    expect(waCall.data.tipo).toBe("pedido")
    expect(waCall.data.mensaje).toContain("reposición automática")
    expect(waCall.data.mensaje).toContain("Yerba Mate Taragui 1kg")
    expect(waCall.data.mensaje).toContain("Azúcar Ledesma 1kg")
    expect(waCall.data.mensaje).toContain("Orden de Compra: #00000011")
  })
})
