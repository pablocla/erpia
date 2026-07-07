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
      estado: { in: ["pendiente", "vencida"] },
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

  return rows.map((r) => ({
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
  }))
}

export async function avisarMorosoExpensa(
  empresaId: number,
  expensaId: number,
): Promise<{ ok: boolean; motivo?: string }> {
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

  const monto = Number(expensa.montoTotal).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })

  const mensaje = `Hola ${residente.nombre}, le escribimos de ${expensa.unidad.consorcio.nombre}. Su expensa de ${expensa.periodo} (UF ${expensa.unidad.numero}) por ${monto} está pendiente. Ante cualquier duda, respondanos por este medio.`

  const ok = await encolarWhatsAppNiche({
    empresaId,
    appSku: "niche.consorcios",
    clienteNombre: residente.nombre,
    telefono: residente.telefono,
    concepto: `Expensa ${expensa.periodo} UF ${expensa.unidad.numero}`,
    monto: Number(expensa.montoTotal),
    mensajeCustom: mensaje,
  })

  return ok ? { ok: true } : { ok: false, motivo: "WhatsApp no configurado" }
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