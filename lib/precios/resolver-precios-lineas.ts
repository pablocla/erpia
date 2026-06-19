/**
 * Resuelve precios de líneas comerciales usando el motor de precios.
 * Si precioUnitario viene explícito (> 0), se respeta como override manual.
 */
import { calcularPrecio, type CalcPrecioResult } from "@/lib/precios/motor-precios"

export interface LineaPrecioInput {
  productoId?: number
  cantidad: number
  precioUnitario?: number
}

export interface LineaPrecioResuelta extends LineaPrecioInput {
  precioUnitario: number
  precioOrigen?: CalcPrecioResult["origen"]
  listaAplicada?: string
}

export interface ResolverPreciosOpts {
  empresaId: number
  clienteId?: number
  fecha?: Date
  /** Si true, siempre usa motor cuando hay productoId */
  forzarLista?: boolean
}

export async function resolverPreciosLineas(
  lineas: LineaPrecioInput[],
  opts: ResolverPreciosOpts
): Promise<LineaPrecioResuelta[]> {
  const fecha = opts.fecha ?? new Date()

  return Promise.all(
    lineas.map(async (linea) => {
      const overrideManual =
        linea.precioUnitario !== undefined &&
        linea.precioUnitario !== null &&
        linea.precioUnitario > 0 &&
        !opts.forzarLista

      if (overrideManual || !linea.productoId) {
        return {
          ...linea,
          precioUnitario: linea.precioUnitario ?? 0,
          precioOrigen: overrideManual ? "manual" : undefined,
        }
      }

      const resultado = await calcularPrecio({
        productoId: linea.productoId,
        clienteId: opts.clienteId,
        cantidad: linea.cantidad,
        fecha,
        empresaId: opts.empresaId,
      })

      return {
        ...linea,
        precioUnitario: resultado.precioFinal,
        precioOrigen: resultado.origen,
        listaAplicada: resultado.listaAplicada,
      }
    })
  )
}