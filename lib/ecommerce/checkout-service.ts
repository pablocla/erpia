import { prisma } from "@/lib/prisma"
import { ventasService } from "@/lib/ventas/ventas-service"
import {
  getTiendaConfigByEmpresaId,
  isMedioPagoHabilitado,
} from "./store-config-service"
import { crearPreferenciaPedidoEcommerce } from "./payment-providers/mercadopago-checkout"
import { buildTransferenciaInstrucciones } from "./payment-providers/transferencia"
import type { CheckoutInput, CheckoutResult, MedioPagoEcommerce } from "./types"
import { cotizarMultiCarrier } from "@/lib/logistica/shipping-orchestrator"

function cleanText(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function normalizeCanalVentaCodigo(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/[^a-z0-9]/gi, "").toLowerCase()
  if (normalized === "ecommerce" || normalized === "ecom") return "ONLINE"
  return trimmed
}

function resolveMedioPago(input: CheckoutInput): MedioPagoEcommerce {
  if (input.medioPago) return input.medioPago
  if (input.autoConfirmar === false) return "confirmar_sin_pago"
  return "confirmar_sin_pago"
}

function shouldAutoConfirmar(input: CheckoutInput, medio: MedioPagoEcommerce): boolean {
  if (medio === "mercadopago" || medio === "transferencia") return false
  return input.autoConfirmar ?? true
}

export class EcommerceCheckoutError extends Error {
  constructor(
    message: string,
    public status: number,
    public extra?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "EcommerceCheckoutError"
  }
}

export async function procesarCheckoutEcommerce(input: CheckoutInput): Promise<CheckoutResult> {
  const {
    empresaId,
    canalVentaId: canalVentaIdInput,
    canalVentaCodigo,
    observaciones,
    fechaEntregaEst,
    cliente,
    lineas,
  } = input

  const medioPago = resolveMedioPago(input)
  const autoConfirmar = shouldAutoConfirmar(input, medioPago)
  const canalVentaCodigoResolved = normalizeCanalVentaCodigo(canalVentaCodigo)

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) {
    throw new EcommerceCheckoutError("Empresa no encontrada", 404)
  }

  const tiendaConfig = await getTiendaConfigByEmpresaId(empresaId)
  if (tiendaConfig) {
    const mapMedio: Record<MedioPagoEcommerce, keyof typeof tiendaConfig.mediosPago> = {
      mercadopago: "mercadopago",
      transferencia: "transferencia",
      confirmar_sin_pago: "confirmarSinPago",
    }
    const key = mapMedio[medioPago]
    if (!isMedioPagoHabilitado(tiendaConfig.mediosPago, key)) {
      throw new EcommerceCheckoutError(`Medio de pago no habilitado: ${medioPago}`, 400)
    }
  }

  let canalVenta = null
  if (canalVentaIdInput) {
    canalVenta = await prisma.canalVenta.findUnique({ where: { id: canalVentaIdInput } })
    if (!canalVenta) {
      throw new EcommerceCheckoutError("Canal de venta no encontrado", 404)
    }
  }

  if (!canalVenta && canalVentaCodigoResolved) {
    canalVenta = await prisma.canalVenta.findFirst({
      where: {
        OR: [
          { codigo: { equals: canalVentaCodigoResolved, mode: "insensitive" } },
          { nombre: { equals: canalVentaCodigoResolved, mode: "insensitive" } },
        ],
      },
    })
  }

  const canalVentaId = canalVenta?.id ?? canalVentaIdInput ?? null

  const clienteData = {
    nombre: cliente.nombre,
    email: cleanText(cliente.email),
    telefono: cleanText(cliente.telefono),
    direccion: cleanText(cliente.direccion),
    direccionComplemento: cleanText(cliente.direccionComplemento),
    codigoPostal: cleanText(cliente.codigoPostal),
    dni: cleanText(cliente.dni),
    cuit: cleanText(cliente.cuit),
  }

  const lookupFilters: Array<Record<string, string>> = []
  if (clienteData.email) lookupFilters.push({ email: clienteData.email })
  if (clienteData.dni) lookupFilters.push({ dni: clienteData.dni })
  if (clienteData.cuit) lookupFilters.push({ cuit: clienteData.cuit })

  let clienteDb = null
  if (lookupFilters.length > 0) {
    clienteDb = await prisma.cliente.findFirst({
      where: { empresaId, OR: lookupFilters },
    })
  }

  if (!clienteDb) {
    clienteDb = await prisma.cliente.create({
      data: {
        nombre: clienteData.nombre,
        tipoPersona: clienteData.cuit ? "persona_juridica" : "persona_fisica",
        email: clienteData.email ?? null,
        telefono: clienteData.telefono ?? null,
        direccion: clienteData.direccion ?? null,
        direccionComplemento: clienteData.direccionComplemento ?? null,
        codigoPostal: clienteData.codigoPostal ?? null,
        dni: clienteData.dni ?? null,
        cuit: clienteData.cuit ?? null,
        canalVentaId,
        empresaId,
      },
    })
  } else {
    const updateData: Record<string, string | number | null> = {}
    if (clienteData.email) updateData.email = clienteData.email
    if (clienteData.telefono) updateData.telefono = clienteData.telefono
    if (clienteData.direccion) updateData.direccion = clienteData.direccion
    if (clienteData.direccionComplemento) updateData.direccionComplemento = clienteData.direccionComplemento
    if (clienteData.codigoPostal) updateData.codigoPostal = clienteData.codigoPostal
    if (clienteData.dni) updateData.dni = clienteData.dni
    if (clienteData.cuit) updateData.cuit = clienteData.cuit
    if (canalVentaId && !clienteDb.canalVentaId) updateData.canalVentaId = canalVentaId

    if (Object.keys(updateData).length > 0) {
      clienteDb = await prisma.cliente.update({
        where: { id: clienteDb.id },
        data: updateData,
      })
    }
  }

  const productIds = [...new Set(lineas.map((linea) => linea.productoId))]
  const productos = await prisma.producto.findMany({
    where: { empresaId, id: { in: productIds }, activo: true },
    select: { id: true, nombre: true, precioVenta: true, stock: true },
  })

  if (productos.length !== productIds.length) {
    throw new EcommerceCheckoutError("Productos no encontrados", 404)
  }

  const productoMap = new Map(productos.map((producto) => [producto.id, producto]))
  const insuficientes: Array<{ productoId: number; nombre: string; stock: number; solicitado: number }> = []

  for (const linea of lineas) {
    const producto = productoMap.get(linea.productoId)
    if (!producto) continue
    if (producto.stock < linea.cantidad) {
      insuficientes.push({
        productoId: producto.id,
        nombre: producto.nombre,
        stock: producto.stock,
        solicitado: linea.cantidad,
      })
    }
  }

  if (insuficientes.length > 0) {
    throw new EcommerceCheckoutError("Stock insuficiente", 409, { insuficientes })
  }

  const markupPct = canalVenta ? Number(canalVenta.markupPct) : 0

  const lineasPedido = lineas.map((linea) => {
    const producto = productoMap.get(linea.productoId)
    if (!producto) {
      return {
        productoId: linea.productoId,
        descripcion: "Producto",
        cantidad: linea.cantidad,
        precioUnitario: 0,
      }
    }

    const precioBase = Number(producto.precioVenta)
    const precioUnitario = roundMoney(precioBase * (1 + markupPct / 100))

    return {
      productoId: producto.id,
      descripcion: producto.nombre,
      cantidad: linea.cantidad,
      precioUnitario,
    }
  })

  let costoEnvioElegido = 0
  if (clienteData.codigoPostal) {
    try {
      const pesoEstimado = lineas.reduce((acc, l) => acc + l.cantidad, 0)
      const cotizaciones = await cotizarMultiCarrier({
        empresaId,
        origen: { cp: "2000", provincia: "Santa Fe" },
        destinatario: {
          cp: clienteData.codigoPostal,
          direccion: clienteData.direccion || "",
          localidad: "",
          provincia: ""
        },
        pesoKg: pesoEstimado,
        valorDeclarado: lineasPedido.reduce((acc, l) => acc + (l.precioUnitario * l.cantidad), 0)
      }, input.carrierElegido ? [input.carrierElegido as any] : undefined)

      if (cotizaciones.length > 0) {
        costoEnvioElegido = cotizaciones[0].precio
        lineasPedido.push({
          productoId: 0, 
          descripcion: `Envío a domicilio (${cotizaciones[0].carrierId})`,
          cantidad: 1,
          precioUnitario: costoEnvioElegido,
        } as any)
      }
    } catch (e) {
      console.warn("[CHECKOUT] Fallo cotización de flete", e)
    }
  }

  const notaBase = observaciones ? `Ecommerce: ${observaciones}` : "Ecommerce"
  const nota =
    medioPago === "mercadopago"
      ? `${notaBase} [pago:mercadopago]`
      : medioPago === "transferencia"
        ? `${notaBase} [pago:transferencia]`
        : notaBase

  const pedido = await ventasService.crearPedidoVenta({
    clienteId: clienteDb.id,
    empresaId,
    canalVentaId: canalVentaId ?? undefined,
    fechaEntregaEst: fechaEntregaEst ? new Date(fechaEntregaEst) : undefined,
    observaciones: nota,
    lineas: lineasPedido,
    usarListaPrecios: false,
  })

  let pedidoFinal = pedido
  const montoTotal = Number(pedido.total)

  if (medioPago === "mercadopago" || medioPago === "transferencia") {
    pedidoFinal = await ventasService.marcarPendientePago(pedido.id, empresaId)
  } else if (autoConfirmar) {
    try {
      await ventasService.confirmarPedido(pedido.id, empresaId)
      pedidoFinal = { ...pedido, estado: "confirmado" }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo confirmar el pedido"
      throw new EcommerceCheckoutError(message, 409, { pedidoId: pedido.id, estado: pedido.estado })
    }
  }

  const result: CheckoutResult = {
    pedido: {
      id: pedidoFinal.id,
      numero: pedidoFinal.numero,
      estado: pedidoFinal.estado,
      total: montoTotal,
    },
  }

  if (medioPago === "mercadopago") {
    const slug = tiendaConfig?.slug ?? null
    const initPoint = await crearPreferenciaPedidoEcommerce({
      empresaId,
      pedidoId: pedido.id,
      numeroPedido: pedido.numero,
      monto: montoTotal,
      emailPagador: clienteData.email,
      slug,
    })
    result.pago = { tipo: "mercadopago", initPoint }
  }

  if (medioPago === "transferencia") {
    const configRow = await prisma.tiendaConfig.findUnique({ where: { empresaId } })
    result.pago = {
      tipo: "transferencia",
      transferencia: buildTransferenciaInstrucciones({
        cbu: configRow?.transferenciaCbu ?? null,
        alias: configRow?.transferenciaAlias ?? null,
        titular: configRow?.transferenciaTitular ?? null,
        monto: montoTotal,
        numeroPedido: pedido.numero,
        pedidoId: pedido.id,
      }),
    }
  }

  return result
}