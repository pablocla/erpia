import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/ventas/ventas-service", () => ({
  ventasService: {
    crearPedidoVenta: vi.fn(),
    confirmarPedido: vi.fn(),
    marcarPendientePago: vi.fn(),
  },
}))

vi.mock("@/lib/ecommerce/store-config-service", () => ({
  getTiendaConfigByEmpresaId: vi.fn(),
  isMedioPagoHabilitado: vi.fn((medios: Record<string, boolean>, key: string) => medios[key] === true),
}))

vi.mock("@/lib/ecommerce/payment-providers/mercadopago-checkout", () => ({
  crearPreferenciaPedidoEcommerce: vi.fn(),
}))

import { ventasService } from "@/lib/ventas/ventas-service"
import { getTiendaConfigByEmpresaId } from "@/lib/ecommerce/store-config-service"
import { crearPreferenciaPedidoEcommerce } from "@/lib/ecommerce/payment-providers/mercadopago-checkout"
import { procesarCheckoutEcommerce, EcommerceCheckoutError } from "@/lib/ecommerce/checkout-service"

const baseInput = {
  empresaId: 1,
  cliente: { nombre: "Juan Pérez", email: "juan@test.com" },
  lineas: [{ productoId: 10, cantidad: 2 }],
}

beforeEach(() => {
  vi.clearAllMocks()

  mockPrismaClient.empresa.findUnique.mockResolvedValue({ id: 1, nombre: "Demo" })
  mockPrismaClient.cliente.findFirst.mockResolvedValue(null)
  mockPrismaClient.cliente.create.mockResolvedValue({ id: 5, canalVentaId: null })
  mockPrismaClient.producto.findMany.mockResolvedValue([
    { id: 10, nombre: "Producto A", precioVenta: 1000, stock: 50 },
  ])
  mockPrismaClient.tiendaConfig.findUnique.mockResolvedValue({
    transferenciaCbu: "123",
    transferenciaAlias: "demo.alias",
    transferenciaTitular: "Demo SA",
  })

  vi.mocked(ventasService.crearPedidoVenta).mockResolvedValue({
    id: 99,
    numero: "PV-000099",
    estado: "borrador",
    total: 2420,
  } as never)

  vi.mocked(getTiendaConfigByEmpresaId).mockResolvedValue({
    empresaId: 1,
    slug: "demo",
    nombreTienda: "Demo",
    logoUrl: null,
    colorPrimario: null,
    mediosPago: { mercadopago: true, transferencia: true, confirmarSinPago: true },
    textoEnvio: null,
    textoFooter: null,
  })
})

describe("procesarCheckoutEcommerce", () => {
  it("legacy: autoConfirmar confirma pedido sin pago online", async () => {
    vi.mocked(ventasService.confirmarPedido).mockResolvedValue({} as never)

    const result = await procesarCheckoutEcommerce({ ...baseInput, autoConfirmar: true })

    expect(ventasService.crearPedidoVenta).toHaveBeenCalled()
    expect(ventasService.confirmarPedido).toHaveBeenCalledWith(99, 1)
    expect(ventasService.marcarPendientePago).not.toHaveBeenCalled()
    expect(result.pedido.estado).toBe("confirmado")
  })

  it("mercadopago: deja pedido pendiente_pago y devuelve init_point", async () => {
    vi.mocked(ventasService.marcarPendientePago).mockResolvedValue({
      id: 99,
      numero: "PV-000099",
      estado: "pendiente_pago",
      total: 2420,
    } as never)
    vi.mocked(crearPreferenciaPedidoEcommerce).mockResolvedValue("https://mp.test/pay")

    const result = await procesarCheckoutEcommerce({
      ...baseInput,
      medioPago: "mercadopago",
      autoConfirmar: false,
    })

    expect(ventasService.marcarPendientePago).toHaveBeenCalledWith(99, 1)
    expect(ventasService.confirmarPedido).not.toHaveBeenCalled()
    expect(crearPreferenciaPedidoEcommerce).toHaveBeenCalled()
    expect(result.pago?.tipo).toBe("mercadopago")
    expect(result.pago?.initPoint).toBe("https://mp.test/pay")
    expect(result.pedido.estado).toBe("pendiente_pago")
  })

  it("transferencia: devuelve instrucciones bancarias", async () => {
    vi.mocked(ventasService.marcarPendientePago).mockResolvedValue({
      id: 99,
      numero: "PV-000099",
      estado: "pendiente_pago",
      total: 2420,
    } as never)

    const result = await procesarCheckoutEcommerce({
      ...baseInput,
      medioPago: "transferencia",
    })

    expect(result.pago?.tipo).toBe("transferencia")
    expect(result.pago?.transferencia?.alias).toBe("demo.alias")
    expect(result.pago?.transferencia?.referencia).toContain("PV-000099")
  })

  it("rechaza medio de pago deshabilitado en config", async () => {
    vi.mocked(getTiendaConfigByEmpresaId).mockResolvedValue({
      empresaId: 1,
      slug: "demo",
      nombreTienda: "Demo",
      logoUrl: null,
      colorPrimario: null,
      mediosPago: { mercadopago: false, transferencia: true, confirmarSinPago: true },
      textoEnvio: null,
      textoFooter: null,
    })

    await expect(
      procesarCheckoutEcommerce({ ...baseInput, medioPago: "mercadopago" }),
    ).rejects.toBeInstanceOf(EcommerceCheckoutError)
  })

  it("rechaza stock insuficiente", async () => {
    mockPrismaClient.producto.findMany.mockResolvedValue([
      { id: 10, nombre: "Producto A", precioVenta: 1000, stock: 1 },
    ])

    await expect(procesarCheckoutEcommerce(baseInput)).rejects.toMatchObject({
      message: "Stock insuficiente",
      status: 409,
    })
  })
})