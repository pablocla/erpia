/**
 * B4 — Motor de Precios
 * Jerarquía de prioridad:
 *  1. ListaPrecio asignada al cliente + EscalonPrecio por cantidad
 *  2. ListaPrecio default de la empresa vigente en la fecha + EscalonPrecio
 *  3. Fallback: Producto.precioVenta
 *
 * Nota: PrecioEspecialCliente no existe aún en el schema. Agregar el modelo
 * y descomentar el bloque correspondiente cuando se migre.
 */
import { prisma } from "@/lib/prisma"

export interface CalcPrecioParams {
  productoId: number
  clienteId?: number
  cantidad: number
  fecha: Date
  empresaId: number
}

export interface CalcPrecioResult {
  precioFinal: number
  listaAplicada?: string
  descuentoAplicado?: number
  origen: string
}

/**
 * Busca el mejor precio para un ítem del EscalonPrecio de un ItemListaPrecio.
 * Retorna null si no hay escalón que aplique para esa cantidad.
 */
function aplicarEscalon(
  escalones: Array<{ cantidadDesde: number; cantidadHasta: number | null; precio: number; descuentoPct: number }>,
  precioBase: number,
  cantidad: number
): number | null {
  const escalon = escalones.find(
    (e) => cantidad >= e.cantidadDesde && (e.cantidadHasta === null || cantidad <= e.cantidadHasta)
  )
  if (!escalon) return null
  if (escalon.descuentoPct > 0) {
    return precioBase * (1 - escalon.descuentoPct / 100)
  }
  return Number(escalon.precio)
}

/**
 * Resuelve el precio final para un producto dado los parámetros.
 */
export async function calcularPrecio(params: CalcPrecioParams): Promise<CalcPrecioResult> {
  const { productoId, clienteId, cantidad, fecha, empresaId } = params

  // ── 1. Lista del cliente ──────────────────────────────────────────────────
  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        listaPrecioId: true,
        listaPrecio: {
          select: {
            nombre: true,
            activo: true,
            vigenciaDesde: true,
            vigenciaHasta: true,
            items: {
              where: { productoId },
              select: {
                precio: true,
                descuento: true,
                escalones: {
                  select: { cantidadDesde: true, cantidadHasta: true, precio: true, descuentoPct: true },
                  orderBy: { cantidadDesde: "asc" },
                },
              },
            },
          },
        },
      },
    })

    const lista = cliente?.listaPrecio
    const item = lista?.items[0]

    if (lista && lista.activo && item) {
      const vigenteDesde = lista.vigenciaDesde ? lista.vigenciaDesde <= fecha : true
      const vigenteHasta = lista.vigenciaHasta ? lista.vigenciaHasta >= fecha : true

      if (vigenteDesde && vigenteHasta) {
        const precioBase = Number(item.precio)
        const descuento = Number(item.descuento)
        const precioConDescuento = descuento > 0 ? precioBase * (1 - descuento / 100) : precioBase

        const precioEscalon = aplicarEscalon(
          item.escalones.map((e) => ({
            ...e,
            precio: Number(e.precio),
            descuentoPct: Number(e.descuentoPct),
          })),
          precioConDescuento,
          cantidad
        )

        if (precioEscalon !== null) {
          return {
            precioFinal: precioEscalon,
            listaAplicada: lista.nombre,
            descuentoAplicado: descuento,
            origen: "escalon_lista_cliente",
          }
        }

        return {
          precioFinal: precioConDescuento,
          listaAplicada: lista.nombre,
          descuentoAplicado: descuento > 0 ? descuento : undefined,
          origen: "lista_cliente",
        }
      }
    }
  }

  // ── 2. Lista default de la empresa vigente ────────────────────────────────
  const listaDefault = await prisma.listaPrecio.findFirst({
    where: {
      activo: true,
      vigenciaDesde: { lte: fecha },
      OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: fecha } }],
      items: { some: { productoId } },
      // Filtramos las listas que no estén asignadas a clientes (default = sin cliente)
    },
    orderBy: { vigenciaDesde: "desc" },
    select: {
      nombre: true,
      items: {
        where: { productoId },
        select: {
          precio: true,
          descuento: true,
          escalones: {
            select: { cantidadDesde: true, cantidadHasta: true, precio: true, descuentoPct: true },
            orderBy: { cantidadDesde: "asc" },
          },
        },
      },
    },
  })

  const itemDefault = listaDefault?.items[0]
  if (listaDefault && itemDefault) {
    const precioBase = Number(itemDefault.precio)
    const descuento = Number(itemDefault.descuento)
    const precioConDescuento = descuento > 0 ? precioBase * (1 - descuento / 100) : precioBase

    const precioEscalon = aplicarEscalon(
      itemDefault.escalones.map((e) => ({
        ...e,
        precio: Number(e.precio),
        descuentoPct: Number(e.descuentoPct),
      })),
      precioConDescuento,
      cantidad
    )

    if (precioEscalon !== null) {
      return {
        precioFinal: precioEscalon,
        listaAplicada: listaDefault.nombre,
        descuentoAplicado: descuento,
        origen: "escalon_lista_default",
      }
    }

    return {
      precioFinal: precioConDescuento,
      listaAplicada: listaDefault.nombre,
      descuentoAplicado: descuento > 0 ? descuento : undefined,
      origen: "lista_default",
    }
  }

  // ── 3. Fallback: precioVenta del producto ─────────────────────────────────
  const producto = await prisma.producto.findUnique({
    where: { id: productoId, empresaId },
    select: { precioVenta: true },
  })

  if (!producto) {
    throw new Error(`Producto ${productoId} no encontrado en empresa ${empresaId}`)
  }

  return {
    precioFinal: producto.precioVenta,
    origen: "precio_venta_producto",
  }
}

/**
 * Calcula precios para múltiples ítems en una sola llamada (para POS/ventas).
 * Minimiza roundtrips a la DB.
 */
export async function calcularPreciosLote(
  items: Array<{ productoId: number; cantidad: number }>,
  clienteId: number | undefined,
  fecha: Date,
  empresaId: number
): Promise<Map<number, CalcPrecioResult>> {
  const resultados = new Map<number, CalcPrecioResult>()
  await Promise.all(
    items.map(async ({ productoId, cantidad }) => {
      const resultado = await calcularPrecio({ productoId, clienteId, cantidad, fecha, empresaId })
      resultados.set(productoId, resultado)
    })
  )
  return resultados
}
