/**
 * Motor de Precios — Unit Tests
 * Cubre jerarquía: lista cliente → lista default → precioVenta + escalones.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { calcularPrecio, calcularPreciosLote } from "@/lib/precios/motor-precios"

const fecha = new Date("2026-06-01")
const empresaId = 1

beforeEach(() => {
  vi.clearAllMocks()
})

describe("calcularPrecio", () => {
  it("aplica lista del cliente con descuento", async () => {
    mockPrismaClient.cliente.findUnique.mockResolvedValue({
      listaPrecioId: 10,
      listaPrecio: {
        nombre: "Mayorista",
        activo: true,
        vigenciaDesde: new Date("2026-01-01"),
        vigenciaHasta: null,
        items: [{ precio: 1000, descuento: 10, escalones: [] }],
      },
    })

    const result = await calcularPrecio({
      productoId: 5,
      clienteId: 2,
      cantidad: 1,
      fecha,
      empresaId,
    })

    expect(result.precioFinal).toBe(900)
    expect(result.listaAplicada).toBe("Mayorista")
    expect(result.origen).toBe("lista_cliente")
    expect(result.descuentoAplicado).toBe(10)
  })

  it("aplica escalón por cantidad en lista del cliente", async () => {
    mockPrismaClient.cliente.findUnique.mockResolvedValue({
      listaPrecioId: 10,
      listaPrecio: {
        nombre: "Distribuidor",
        activo: true,
        vigenciaDesde: new Date("2026-01-01"),
        vigenciaHasta: null,
        items: [
          {
            precio: 1000,
            descuento: 0,
            escalones: [
              { cantidadDesde: 10, cantidadHasta: null, precio: 850, descuentoPct: 0 },
            ],
          },
        ],
      },
    })

    const result = await calcularPrecio({
      productoId: 5,
      clienteId: 2,
      cantidad: 12,
      fecha,
      empresaId,
    })

    expect(result.precioFinal).toBe(850)
    expect(result.origen).toBe("escalon_lista_cliente")
  })

  it("ignora lista del cliente si está fuera de vigencia y usa lista default", async () => {
    mockPrismaClient.cliente.findUnique.mockResolvedValue({
      listaPrecioId: 10,
      listaPrecio: {
        nombre: "Vencida",
        activo: true,
        vigenciaDesde: new Date("2025-01-01"),
        vigenciaHasta: new Date("2025-12-31"),
        items: [{ precio: 500, descuento: 0, escalones: [] }],
      },
    })
    mockPrismaClient.listaPrecio.findFirst.mockResolvedValue({
      nombre: "Público",
      items: [{ precio: 1200, descuento: 0, escalones: [] }],
    })

    const result = await calcularPrecio({
      productoId: 5,
      clienteId: 2,
      cantidad: 1,
      fecha,
      empresaId,
    })

    expect(result.precioFinal).toBe(1200)
    expect(result.origen).toBe("lista_default")
    expect(result.listaAplicada).toBe("Público")
  })

  it("usa precioVenta del producto como fallback", async () => {
    mockPrismaClient.listaPrecio.findFirst.mockResolvedValue(null)
    mockPrismaClient.producto.findUnique.mockResolvedValue({ precioVenta: 2500 })

    const result = await calcularPrecio({
      productoId: 99,
      cantidad: 1,
      fecha,
      empresaId,
    })

    expect(result.precioFinal).toBe(2500)
    expect(result.origen).toBe("precio_venta_producto")
  })

  it("lanza error si el producto no existe en la empresa", async () => {
    mockPrismaClient.listaPrecio.findFirst.mockResolvedValue(null)
    mockPrismaClient.producto.findUnique.mockResolvedValue(null)

    await expect(
      calcularPrecio({ productoId: 404, cantidad: 1, fecha, empresaId })
    ).rejects.toThrow("Producto 404 no encontrado")
  })
})

describe("calcularPreciosLote", () => {
  it("calcula precios para múltiples productos", async () => {
    mockPrismaClient.listaPrecio.findFirst.mockResolvedValue(null)
    mockPrismaClient.producto.findUnique
      .mockResolvedValueOnce({ precioVenta: 100 })
      .mockResolvedValueOnce({ precioVenta: 200 })

    const map = await calcularPreciosLote(
      [
        { productoId: 1, cantidad: 1 },
        { productoId: 2, cantidad: 3 },
      ],
      undefined,
      fecha,
      empresaId
    )

    expect(map.get(1)?.precioFinal).toBe(100)
    expect(map.get(2)?.precioFinal).toBe(200)
    expect(map.size).toBe(2)
  })
})