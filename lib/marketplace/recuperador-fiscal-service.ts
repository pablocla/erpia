/**
 * Recuperador Fiscal — cruza percepciones sufridas en compras vs detalle tributario.
 */
import { prisma } from "@/lib/prisma"

export interface PercepcionSinDetalle {
  compraId: number
  numero: string
  proveedorNombre: string
  fecha: string
  totalPercepciones: number
}

export interface RecuperadorFiscalResumen {
  periodoDesde: string
  totalPercepcionesCompras: number
  totalTributosDetalle: number
  montoRecuperableEstimado: number
  comprasSinDetalle: number
  proveedoresRiesgo: number
  alerta: boolean
  detalle: PercepcionSinDetalle[]
}

export async function auditarPercepcionesRecuperables(
  empresaId: number,
  meses = 12,
): Promise<RecuperadorFiscalResumen> {
  const desde = new Date()
  desde.setMonth(desde.getMonth() - meses)
  desde.setHours(0, 0, 0, 0)

  const compras = await prisma.compra.findMany({
    where: {
      empresaId,
      deletedAt: null,
      fecha: { gte: desde },
      totalPercepciones: { gt: 0 },
    },
    select: {
      id: true,
      numero: true,
      fecha: true,
      totalPercepciones: true,
      proveedor: { select: { nombre: true, cuit: true, activo: true } },
      tributos: { select: { importe: true } },
    },
    orderBy: { fecha: "desc" },
    take: 200,
  })

  const detalle: PercepcionSinDetalle[] = []
  let totalPercepcionesCompras = 0
  let totalTributosDetalle = 0

  for (const c of compras) {
    const perc = Number(c.totalPercepciones)
    totalPercepcionesCompras += perc
    const tributosSum = c.tributos.reduce((s, t) => s + Number(t.importe), 0)
    totalTributosDetalle += tributosSum

    if (perc > 0 && tributosSum < perc * 0.5) {
      detalle.push({
        compraId: c.id,
        numero: c.numero,
        proveedorNombre: c.proveedor.nombre,
        fecha: c.fecha.toISOString().slice(0, 10),
        totalPercepciones: perc,
      })
    }
  }

  const montoRecuperableEstimado = detalle.reduce((s, d) => s + d.totalPercepciones, 0)

  const proveedoresRiesgo = await prisma.proveedor.count({
    where: {
      empresaId,
      activo: true,
      deletedAt: null,
      OR: [
        { cuit: { endsWith: "00000000" } },
        { cuit: "" },
      ],
    },
  })

  return {
    periodoDesde: desde.toISOString().slice(0, 10),
    totalPercepcionesCompras: Math.round(totalPercepcionesCompras * 100) / 100,
    totalTributosDetalle: Math.round(totalTributosDetalle * 100) / 100,
    montoRecuperableEstimado: Math.round(montoRecuperableEstimado * 100) / 100,
    comprasSinDetalle: detalle.length,
    proveedoresRiesgo,
    alerta: montoRecuperableEstimado > 5000 || proveedoresRiesgo > 0,
    detalle: detalle.slice(0, 15),
  }
}