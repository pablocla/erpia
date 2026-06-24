/**
 * Informa a AFIP los comprobantes emitidos offline con CAEA.
 */
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "./soap-client"
import { CAEAService } from "./caea-service"
import { getCaeaConfig } from "./caea-config"

export interface InformarCaeaResult {
  informados: number
  errores: string[]
  ok: boolean
}

export async function informarComprobantesCaeaPendientes(
  empresaId: number,
  puntoVenta?: number,
): Promise<InformarCaeaResult> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      cuit: true,
      certificadoCRT: true,
      certificadoKEY: true,
      entornoAfip: true,
      caeaVigente: true,
    },
  })

  if (!empresa?.certificadoCRT || !empresa.certificadoKEY) {
    return { informados: 0, errores: ["Certificados AFIP no configurados"], ok: false }
  }

  const caea = empresa.caeaVigente
  if (!caea) {
    return { informados: 0, errores: [], ok: true }
  }

  const facturasOffline = await prisma.factura.findMany({
    where: {
      empresaId,
      modalidadAuth: "CAEA",
      caea,
      estado: "caea_emitida",
      ...(puntoVenta ? { puntoVenta } : {}),
    },
    include: { cliente: true },
    orderBy: [{ tipoCbte: "asc" }, { numero: "asc" }],
    take: 100,
  })

  if (facturasOffline.length === 0) {
    return { informados: 0, errores: [], ok: true }
  }

  const entorno = (empresa.entornoAfip as "homologacion" | "produccion") ?? "homologacion"
  const soapClient = new AFIPSoapClient(entorno)
  const caeaService = new CAEAService(entorno)
  const auth = await soapClient.authenticate(
    empresa.cuit,
    empresa.certificadoCRT,
    empresa.certificadoKEY,
  )

  const grupos = new Map<number, typeof facturasOffline>()
  for (const f of facturasOffline) {
    if (!grupos.has(f.puntoVenta)) grupos.set(f.puntoVenta, [])
    grupos.get(f.puntoVenta)!.push(f)
  }

  const erroresTotal: string[] = []
  let informados = 0
  const informadosIds: number[] = []

  for (const [pv, facturas] of grupos) {
    const comprobantes = facturas.map((f) => ({
      tipoCbte: f.tipoCbte,
      cbteDesde: f.numero,
      cbteHasta: f.numero,
      fecha: f.createdAt.toISOString().slice(0, 10).replace(/-/g, ""),
      docTipo: f.cliente?.cuit ? 80 : f.cliente?.dni ? 96 : 99,
      docNro: String(f.cliente?.cuit || f.cliente?.dni || "0").replace(/\D/g, "") || "0",
      impTotal: Number(f.total) + Number(f.totalPercepciones ?? 0),
      impNeto: Number(f.subtotal),
      impIVA: Number(f.iva),
      impTrib: Number(f.totalPercepciones ?? 0),
    }))

    const resultado = await caeaService.informarComprobantesCAEA(
      auth,
      empresa.cuit,
      pv,
      caea,
      comprobantes,
    )

    if (resultado.ok) {
      informados += facturas.length
      informadosIds.push(...facturas.map((f) => f.id))
    } else {
      erroresTotal.push(...resultado.errores)
    }
  }

  if (informadosIds.length > 0) {
    await prisma.factura.updateMany({
      where: { id: { in: informadosIds } },
      data: { estado: "caea_informada" },
    })
  }

  return {
    informados,
    errores: erroresTotal,
    ok: erroresTotal.length === 0,
  }
}

export async function syncCaeaEmpresa(empresaId: number): Promise<InformarCaeaResult> {
  const config = await getCaeaConfig(empresaId)
  if (!config.autoInformar) {
    return { informados: 0, errores: [], ok: true }
  }
  return informarComprobantesCaeaPendientes(empresaId)
}