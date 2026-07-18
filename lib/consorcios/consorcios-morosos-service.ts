import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import { encolarWhatsAppNiche } from "@/lib/niche/niche-whatsapp"

export interface MorosoExpensaRow {
  expensaId: number
  periodo: string
  monto: number
  estado: string
  fechaVencimiento: string | null
  diasMora: number
  unidadNumero: string
  consorcioId: number
  consorcioNombre: string
  residenteId: number | null
  residenteNombre: string | null
  residenteTelefono: string | null
  facturaId: number | null
  cuentaCobrarId: number | null
}

function diasMoraDesde(fecha: Date | null): number {
  if (!fecha) return 0
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const v = new Date(fecha)
  v.setHours(0, 0, 0, 0)
  const diff = Math.floor((hoy.getTime() - v.getTime()) / 86_400_000)
  return diff > 0 ? diff : 0
}

export async function listarMorososExpensas(empresaId: number, consorcioId?: number): Promise<MorosoExpensaRow[]> {
  const hoy = new Date()
  const rows = await prisma.consorcioExpensa.findMany({
    where: {
      estado: { in: ["pendiente", "vencida", "parcial"] },
      unidad: {
        consorcio: whereEmpresa(empresaId, consorcioId ? { id: consorcioId } : {}),
      },
      OR: [{ fechaVencimiento: { lte: hoy } }, { fechaVencimiento: null }],
    },
    include: {
      unidad: {
        include: {
          residente: { select: { id: true, nombre: true, telefono: true } },
          consorcio: { select: { id: true, nombre: true } },
        },
      },
    },
    orderBy: [{ fechaVencimiento: "asc" }, { periodo: "desc" }],
    take: 100,
  })

  const mapped = await Promise.all(
    rows.map(async (r) => {
      let cuentaCobrarId: number | null = null
      if (r.facturaId && r.unidad.residente?.id) {
        const cc = await prisma.cuentaCobrar.findFirst({
          where: {
            facturaId: r.facturaId,
            clienteId: r.unidad.residente.id,
            saldo: { gt: 0 },
          },
          select: { id: true },
        })
        cuentaCobrarId = cc?.id ?? null
      }
      return {
        expensaId: r.id,
        periodo: r.periodo,
        monto: Number(r.montoTotal),
        estado: r.estado,
        fechaVencimiento: r.fechaVencimiento?.toISOString().slice(0, 10) ?? null,
        diasMora: diasMoraDesde(r.fechaVencimiento),
        unidadNumero: r.unidad.numero,
        consorcioId: r.unidad.consorcio.id,
        consorcioNombre: r.unidad.consorcio.nombre,
        residenteId: r.unidad.residente?.id ?? null,
        residenteNombre: r.unidad.residente?.nombre ?? null,
        residenteTelefono: r.unidad.residente?.telefono ?? null,
        facturaId: r.facturaId,
        cuentaCobrarId,
      }
    }),
  )
  return mapped
}

export async function avisarMorosoExpensa(
  empresaId: number,
  expensaId: number,
): Promise<{ ok: boolean; motivo?: string; linkPago?: string | null }> {
  const expensa = await prisma.consorcioExpensa.findFirst({
    where: {
      id: expensaId,
      unidad: { consorcio: { empresaId } },
    },
    include: {
      unidad: {
        include: {
          residente: true,
          consorcio: true,
        },
      },
    },
  })
  if (!expensa) return { ok: false, motivo: "Expensa no encontrada" }

  const residente = expensa.unidad.residente
  if (!residente?.telefono) return { ok: false, motivo: "Residente sin teléfono" }

  const montoNum = Number(expensa.montoTotal)
  const monto = montoNum.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })

  // Resolver CxC para link MP
  let cuentaCobrarId: number | undefined
  if (expensa.facturaId && residente.id) {
    const cc = await prisma.cuentaCobrar.findFirst({
      where: {
        facturaId: expensa.facturaId,
        clienteId: residente.id,
        saldo: { gt: 0 },
      },
      select: { id: true },
    })
    cuentaCobrarId = cc?.id
  }

  const { resolverLinkPagoDeudor } = await import("@/lib/mercadopago/deudor-pago-link")
  const linkPago = await resolverLinkPagoDeudor({
    empresaId,
    clienteId: residente.id,
    clienteNombre: residente.nombre,
    monto: montoNum,
    titulo: `Expensa ${expensa.periodo} UF ${expensa.unidad.numero}`,
    facturaId: expensa.facturaId,
    cuentaCobrarId,
    emailPagador: residente.email,
  })

  const linkLinea = linkPago
    ? ` Pagá online: ${linkPago}`
    : " Ante cualquier duda, respondanos por este medio."

  const mensaje = `Hola ${residente.nombre}, le escribimos de ${expensa.unidad.consorcio.nombre}. Su expensa de ${expensa.periodo} (UF ${expensa.unidad.numero}) por ${monto} está pendiente.${linkLinea}`

  const ok = await encolarWhatsAppNiche({
    empresaId,
    appSku: "niche.consorcios",
    clienteNombre: residente.nombre,
    telefono: residente.telefono,
    concepto: `Expensa ${expensa.periodo} UF ${expensa.unidad.numero}`,
    monto: montoNum,
    mensajeCustom: mensaje,
  })

  if (!ok) return { ok: false, motivo: "WhatsApp no configurado", linkPago }
  return { ok: true, linkPago }
}

/** Solo genera link MP (sin WhatsApp) — para botón en UI */
export async function linkPagoExpensa(
  empresaId: number,
  expensaId: number,
): Promise<{ ok: boolean; linkPago?: string; motivo?: string }> {
  const expensa = await prisma.consorcioExpensa.findFirst({
    where: {
      id: expensaId,
      unidad: { consorcio: { empresaId } },
    },
    include: {
      unidad: {
        include: {
          residente: true,
        },
      },
    },
  })
  if (!expensa) return { ok: false, motivo: "Expensa no encontrada" }
  const residente = expensa.unidad.residente
  if (!residente) return { ok: false, motivo: "Sin residente" }

  let cuentaCobrarId: number | undefined
  if (expensa.facturaId) {
    const cc = await prisma.cuentaCobrar.findFirst({
      where: {
        facturaId: expensa.facturaId,
        clienteId: residente.id,
        saldo: { gt: 0 },
      },
      select: { id: true },
    })
    cuentaCobrarId = cc?.id
  }

  const { resolverLinkPagoDeudor } = await import("@/lib/mercadopago/deudor-pago-link")
  const linkPago = await resolverLinkPagoDeudor({
    empresaId,
    clienteId: residente.id,
    clienteNombre: residente.nombre,
    monto: Number(expensa.montoTotal),
    titulo: `Expensa ${expensa.periodo} UF ${expensa.unidad.numero}`,
    facturaId: expensa.facturaId,
    cuentaCobrarId,
    emailPagador: residente.email,
  })

  if (!linkPago) {
    return {
      ok: false,
      motivo: "Mercado Pago no configurado o ClavPay inactivo",
    }
  }
  return { ok: true, linkPago }
}

/** Vencimiento típico: día 10 del mes siguiente al período liquidado */
export function vencimientoExpensaDesdePeriodo(periodo: string): Date {
  const [yearStr, monthStr] = periodo.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!year || !month) return new Date()
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }
  return new Date(nextMonth.y, nextMonth.m - 1, 10)
}