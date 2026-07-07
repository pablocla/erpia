/**
 * Motor de retenciones — Sprint B7
 * Cálculo automático en cobros (sufridas) y pagos (aplicadas).
 */

import { prisma } from "@/lib/prisma"

export interface RetencionDetalleItem {
  tipo: "IVA" | "GANANCIAS" | "IIBB"
  codigoRegimen: string
  base: number
  alicuota: number
  monto: number
  jurisdiccion?: string
}

export interface RetencionesCalculadas {
  retencionIVA: number
  retencionGanancias: number
  retencionIIBB: number
  total: number
  detalle: RetencionDetalleItem[]
  aplicadas: boolean
}

const DEFAULT_REGIMEN = {
  IVA: { codigo: "767", alicuota: 10.5, minimo: 240000 },
  GANANCIAS: { codigo: "217", alicuota: 2, minimo: 22400 },
  IIBB: { codigo: "305", alicuota: 3, minimo: 10000 },
} as const

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

async function getRegimen(
  empresaId: number,
  codigoSicore: string,
  fallback: { alicuota: number; minimo: number },
) {
  const row = await prisma.regimenRetencion.findFirst({
    where: { empresaId, codigoSicore, activo: true },
    orderBy: { vigenciaDesde: "desc" },
  })
  return {
    codigo: codigoSicore,
    alicuota: row ? Number(row.alicuotaInscripto) : fallback.alicuota,
    minimo: row ? Number(row.minimoNoSujeto) : fallback.minimo,
  }
}

async function acumuladoAnualProveedor(
  empresaId: number,
  proveedorId: number,
  tipo: string,
): Promise<number> {
  const year = new Date().getFullYear()
  const desde = new Date(year, 0, 1)
  const rows = await prisma.retencionSICORE.findMany({
    where: {
      proveedorId,
      tipo: tipo.toLowerCase(),
      fechaRetencion: { gte: desde },
      ordenPago: { proveedor: { empresaId } },
    },
    select: { monto: true },
  })
  return rows.reduce((s, r) => s + Number(r.monto), 0)
}

function calcularLinea(
  base: number,
  regimen: { codigo: string; alicuota: number; minimo: number },
  tipo: RetencionDetalleItem["tipo"],
  jurisdiccion?: string,
): RetencionDetalleItem | null {
  if (base <= regimen.minimo) return null
  const monto = round2((base * regimen.alicuota) / 100)
  if (monto <= 0) return null
  return {
    tipo,
    codigoRegimen: regimen.codigo,
    base: round2(base),
    alicuota: regimen.alicuota,
    monto,
    jurisdiccion,
  }
}

/**
 * Retenciones que aplicamos al pagar a un proveedor (somos agente de retención).
 */
export async function calcularRetencionesPago(input: {
  empresaId: number
  proveedorId: number
  montoBase: number
  jurisdiccion?: string
}): Promise<RetencionesCalculadas> {
  const { empresaId, proveedorId, montoBase, jurisdiccion = "PBA" } = input

  const [config, proveedor] = await Promise.all([
    prisma.configFiscalEmpresa.findUnique({ where: { empresaId } }),
    prisma.proveedor.findFirst({
      where: { id: proveedorId, empresaId },
      select: {
        nroCertificadoExclusion: true,
        vigenciaCertificadoExclusion: true,
        condicionIva: true,
      },
    }),
  ])

  if (!config || !proveedor) {
    return emptyRetenciones()
  }

  if (
    proveedor.nroCertificadoExclusion &&
    proveedor.vigenciaCertificadoExclusion &&
    proveedor.vigenciaCertificadoExclusion > new Date()
  ) {
    return emptyRetenciones()
  }

  const detalle: RetencionDetalleItem[] = []
  const netoEstimado = round2(montoBase / 1.21)

  if (config.esAgenteRetencionIVA && proveedor.condicionIva === "Responsable Inscripto") {
    const reg = await getRegimen(empresaId, DEFAULT_REGIMEN.IVA.codigo, DEFAULT_REGIMEN.IVA)
    const linea = calcularLinea(netoEstimado, reg, "IVA")
    if (linea) detalle.push(linea)
  }

  if (config.esAgenteRetencionGanancias) {
    const reg = await getRegimen(empresaId, DEFAULT_REGIMEN.GANANCIAS.codigo, DEFAULT_REGIMEN.GANANCIAS)
    const acum = await acumuladoAnualProveedor(empresaId, proveedorId, "ganancias")
    const baseAjustada = Math.max(0, montoBase - acum)
    const linea = calcularLinea(baseAjustada, reg, "GANANCIAS")
    if (linea) detalle.push(linea)
  }

  if (config.esAgenteRetencionIIBB) {
    const reg = await getRegimen(empresaId, DEFAULT_REGIMEN.IIBB.codigo, DEFAULT_REGIMEN.IIBB)
    const linea = calcularLinea(montoBase, reg, "IIBB", jurisdiccion)
    if (linea) detalle.push(linea)
  }

  return aggregate(detalle, detalle.length > 0)
}

/**
 * Retenciones sufridas en cobro (el cliente nos retiene).
 */
export async function calcularRetencionesCobroSufridas(input: {
  empresaId: number
  clienteId: number
  montoBase: number
}): Promise<RetencionesCalculadas> {
  const { empresaId, clienteId, montoBase } = input

  const cliente = await prisma.cliente.findFirst({
    where: { id: clienteId, empresaId },
    select: {
      esAgenteRetencionIVA: true,
      esAgenteRetencionGanancias: true,
      nroCertificadoExclusion: true,
      vigenciaCertificadoExclusion: true,
      condicionIva: true,
    },
  })

  if (!cliente) return emptyRetenciones()

  const detalle: RetencionDetalleItem[] = []
  const netoEstimado = round2(montoBase / 1.21)

  if (cliente.esAgenteRetencionIVA && cliente.condicionIva !== "Monotributista") {
    const reg = await getRegimen(empresaId, "219", { alicuota: 10.5, minimo: 0 })
    const monto = round2((netoEstimado * 0.21 * reg.alicuota) / 100)
    if (monto > 0) {
      detalle.push({
        tipo: "IVA",
        codigoRegimen: "219",
        base: netoEstimado,
        alicuota: reg.alicuota,
        monto,
      })
    }
  }

  if (cliente.esAgenteRetencionGanancias) {
    const reg = await getRegimen(empresaId, DEFAULT_REGIMEN.GANANCIAS.codigo, DEFAULT_REGIMEN.GANANCIAS)
    const linea = calcularLinea(montoBase, reg, "GANANCIAS")
    if (linea) detalle.push(linea)
  }

  return aggregate(detalle, detalle.length > 0)
}

function emptyRetenciones(): RetencionesCalculadas {
  return {
    retencionIVA: 0,
    retencionGanancias: 0,
    retencionIIBB: 0,
    total: 0,
    detalle: [],
    aplicadas: false,
  }
}

function aggregate(detalle: RetencionDetalleItem[], aplicadas: boolean): RetencionesCalculadas {
  let retencionIVA = 0
  let retencionGanancias = 0
  let retencionIIBB = 0
  for (const d of detalle) {
    if (d.tipo === "IVA") retencionIVA += d.monto
    if (d.tipo === "GANANCIAS") retencionGanancias += d.monto
    if (d.tipo === "IIBB") retencionIIBB += d.monto
  }
  return {
    retencionIVA: round2(retencionIVA),
    retencionGanancias: round2(retencionGanancias),
    retencionIIBB: round2(retencionIIBB),
    total: round2(retencionIVA + retencionGanancias + retencionIIBB),
    detalle,
    aplicadas,
  }
}

export class RetencionCalculoService {
  calcularRetencionesPago = calcularRetencionesPago
  calcularRetencionesCobroSufridas = calcularRetencionesCobroSufridas
}

export const retencionCalculoService = new RetencionCalculoService()