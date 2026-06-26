/**
 * #7 Zero Waste + #8 remate verdulería tarde.
 */
import { prisma } from "@/lib/prisma"
import { getAlmacenRosarioConfig } from "./config"

const VERDURA_RE = /verdura|fruta|lechuga|tomate|papa|cebolla|banana|manzana|zapallo|acelga/i

export interface ZeroWasteEvaluacion {
  activo: boolean
  aplica: boolean
  descuentoPct: number
  motivo?: string
  diasHastaVencimiento?: number
  loteNumero?: string
}

function diasHasta(fecha: Date): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const v = new Date(fecha)
  v.setHours(0, 0, 0, 0)
  return Math.round((v.getTime() - hoy.getTime()) / 86400000)
}

export async function evaluarZeroWaste(
  empresaId: number,
  productoId: number,
  nombreProducto: string,
  skuActivo = true,
  ahora = new Date(),
): Promise<ZeroWasteEvaluacion> {
  if (!skuActivo) {
    return { activo: false, aplica: false, descuentoPct: 0 }
  }

  const [lote, config] = await Promise.all([
    prisma.lote.findFirst({
      where: {
        productoId,
        estado: "activo",
        fechaVencimiento: { not: null, gte: ahora },
      },
      orderBy: { fechaVencimiento: "asc" },
      select: { numeroLote: true, fechaVencimiento: true },
    }),
    getAlmacenRosarioConfig(empresaId),
  ])

  let descuentoPct = 0
  let motivo: string | undefined
  let dias: number | undefined

  if (lote?.fechaVencimiento) {
    dias = diasHasta(lote.fechaVencimiento)
    const zw = config.zeroWaste
    if (dias <= zw.diasDescuento50) {
      descuentoPct = zw.pctDescuento50
      motivo = `Vence en ${dias}d — remate ${zw.pctDescuento50}%`
    } else if (dias <= zw.diasDescuento30) {
      descuentoPct = zw.pctDescuento30
      motivo = `Vence en ${dias}d — descuento ${zw.pctDescuento30}%`
    }
  }

  const hora = ahora.getHours()
  if (
    hora >= config.zeroWaste.verduleriaTardeDesde &&
    VERDURA_RE.test(nombreProducto) &&
    descuentoPct < config.zeroWaste.verduleriaTardePct
  ) {
    descuentoPct = config.zeroWaste.verduleriaTardePct
    motivo = `Verdulería tarde (desde ${config.zeroWaste.verduleriaTardeDesde}hs) — ${descuentoPct}%`
  }

  return {
    activo: true,
    aplica: descuentoPct > 0,
    descuentoPct,
    motivo,
    diasHastaVencimiento: dias,
    loteNumero: lote?.numeroLote,
  }
}

export async function listarOfertasZeroWasteHoy(empresaId: number, limite = 20) {
  const config = await getAlmacenRosarioConfig(empresaId)
  const hoy = new Date()
  const limiteFecha = new Date()
  limiteFecha.setDate(limiteFecha.getDate() + config.zeroWaste.diasDescuento30)

  const lotes = await prisma.lote.findMany({
    where: {
      estado: "activo",
      fechaVencimiento: { gte: hoy, lte: limiteFecha },
      producto: { empresaId, activo: true },
    },
    include: { producto: { select: { id: true, nombre: true, precioVenta: true } } },
    orderBy: { fechaVencimiento: "asc" },
    take: limite,
  })

  const ofertas = []
  for (const l of lotes) {
    const ev = await evaluarZeroWaste(empresaId, l.productoId, l.producto.nombre, true)
    if (ev.aplica) {
      ofertas.push({
        productoId: l.productoId,
        nombre: l.producto.nombre,
        precioVenta: Number(l.producto.precioVenta),
        descuentoPct: ev.descuentoPct,
        motivo: ev.motivo,
        vence: l.fechaVencimiento?.toISOString().slice(0, 10),
      })
    }
  }
  return ofertas
}