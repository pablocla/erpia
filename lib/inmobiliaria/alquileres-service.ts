import { prisma } from "@/lib/prisma"
import { encolarWhatsAppNiche } from "@/lib/niche/niche-whatsapp"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

/** Período YYYY-MM del mes en curso */
export function periodoAlquilerActual(ref = new Date()): string {
  const month = String(ref.getMonth() + 1).padStart(2, "0")
  return `${ref.getFullYear()}-${month}`
}

/** Vencimiento del alquiler según día configurado en el contrato */
export function vencimientoAlquilerDesdePeriodo(periodo: string, diaVencimiento: number): Date {
  const [yearStr, monthStr] = periodo.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!year || !month) return new Date()
  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(Math.max(diaVencimiento, 1), lastDay)
  return new Date(year, month - 1, day)
}

export type FacturacionAlquilerResult = {
  periodo: string
  generados: number
  omitidos: number
  errores: string[]
}

export async function facturarAlquileresMensuales(
  periodo = periodoAlquilerActual(),
): Promise<FacturacionAlquilerResult> {
  const contratos = await prisma.contratoAlquiler.findMany({
    where: {
      estado: "activo",
      OR: [{ ultimoPeriodoFacturado: null }, { ultimoPeriodoFacturado: { not: periodo } }],
      fechaInicio: { lte: new Date() },
      fechaFin: { gte: new Date() },
    },
    include: {
      propiedad: true,
      inquilino: true,
      empresa: { select: { puntoVenta: true } },
    },
  })

  let generados = 0
  let omitidos = 0
  const errores: string[] = []

  for (const c of contratos) {
    try {
      const monto = Number(c.montoMensual)
      if (monto <= 0) {
        omitidos++
        continue
      }

      const fechaVencimiento = vencimientoAlquilerDesdePeriodo(periodo, c.diaVencimiento)
      const puntoVenta = c.empresa.puntoVenta ?? 1
      const etiqueta = `${c.propiedad.titulo} — Alquiler ${periodo}`

      await prisma.$transaction(async (tx) => {
        const factura = await tx.factura.create({
          data: {
            empresaId: c.empresaId,
            clienteId: c.inquilinoId,
            tipo: "B",
            tipoCbte: 6,
            numero: 0,
            puntoVenta,
            subtotal: monto,
            iva: 0,
            total: monto,
            concepto: 2,
            estado: "interna",
            fechaVtoPago: fechaVencimiento,
            observaciones: `Alquiler ${periodo} — ${c.propiedad.titulo}`,
            lineas: {
              create: [
                {
                  descripcion: etiqueta,
                  cantidad: 1,
                  precioUnitario: monto,
                  porcentajeIva: 0,
                  codigoAfipIva: "3",
                  subtotal: monto,
                  iva: 0,
                  total: monto,
                },
              ],
            },
          },
        })

        await tx.cuentaCobrar.create({
          data: {
            facturaId: factura.id,
            clienteId: c.inquilinoId,
            numeroCuota: 1,
            montoOriginal: monto,
            saldo: monto,
            fechaEmision: new Date(),
            fechaVencimiento,
            estado: "pendiente",
            observaciones: `Alquiler ${periodo} — ${c.propiedad.titulo}`,
          },
        })

        await tx.cliente.update({
          where: { id: c.inquilinoId },
          data: { saldoCuentaCorriente: { increment: monto } },
        })

        await tx.contratoAlquiler.update({
          where: { id: c.id },
          data: { ultimoPeriodoFacturado: periodo },
        })
      })

      generados++
    } catch (e) {
      omitidos++
      errores.push(
        `Contrato ${c.id}: ${e instanceof Error ? e.message : "error"}`,
      )
    }
  }

  return { periodo, generados, omitidos, errores }
}

export async function alertarContratosPorVencer(dias = 30): Promise<{ alertas: number }> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(hoy.getTime() + dias * 86_400_000)

  const contratos = await prisma.contratoAlquiler.findMany({
    where: {
      estado: "activo",
      fechaFin: { gte: hoy, lte: limite },
    },
    include: {
      propiedad: { select: { titulo: true } },
      inquilino: { select: { nombre: true, telefono: true } },
      propietario: { select: { nombre: true, telefono: true } },
    },
  })

  let alertas = 0

  for (const c of contratos) {
    const ya = await prisma.sistemaLog.findFirst({
      where: {
        empresaId: c.empresaId,
        categoria: "inmo.contrato_vence_30",
        mensaje: { contains: String(c.id) },
        createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
      },
    })
    if (ya) continue

    const vence = c.fechaFin.toLocaleDateString("es-AR")
    const msg = `Contrato alquiler ${c.propiedad.titulo} vence el ${vence}.`

    if (c.inquilino.telefono) {
      await encolarWhatsAppNiche({
        empresaId: c.empresaId,
        appSku: "niche.inmo_garantia",
        clienteNombre: c.inquilino.nombre,
        telefono: c.inquilino.telefono,
        concepto: msg,
        mensajeCustom: `Hola ${c.inquilino.nombre}, le avisamos que su contrato de alquiler (${c.propiedad.titulo}) vence el ${vence}. Ante cualquier duda, respondanos por este medio.`,
      })
    }

    if (c.propietario?.telefono) {
      await encolarWhatsAppNiche({
        empresaId: c.empresaId,
        appSku: "niche.inmo_garantia",
        clienteNombre: c.propietario.nombre,
        telefono: c.propietario.telefono,
        concepto: msg,
        mensajeCustom: `Hola ${c.propietario.nombre}, el contrato de alquiler de ${c.propiedad.titulo} vence el ${vence}.`,
      })
    }

    await persistSistemaLog({
      empresaId: c.empresaId,
      severidad: "warn",
      categoria: "inmobiliaria",
      contexto: "inmo.contrato_vence_30",
      mensaje: `Contrato ${c.id} vence ${vence} — ${c.propiedad.titulo}`,
      metadata: { contratoId: c.id, fechaFin: vence, href: "/dashboard/nicho/inmobiliaria" },
    })
    alertas++
  }

  return { alertas }
}

export async function alertarAlquileresImpagos(): Promise<{ avisados: number }> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const cuentas = await prisma.cuentaCobrar.findMany({
    where: {
      estado: { in: ["pendiente", "vencida", "parcial"] },
      fechaVencimiento: { lt: hoy },
      saldo: { gt: 0 },
      observaciones: { contains: "Alquiler" },
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, empresaId: true } },
      factura: { select: { total: true, observaciones: true } },
    },
    take: 50,
  })

  let avisados = 0

  for (const cx of cuentas) {
    if (!cx.cliente?.telefono) continue

    const ya = await prisma.sistemaLog.findFirst({
      where: {
        empresaId: cx.cliente.empresaId,
        categoria: "inmo.alquiler_impago",
        mensaje: { contains: String(cx.id) },
        createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
      },
    })
    if (ya) continue

    const monto = Number(cx.saldo).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    })

    const ok = await encolarWhatsAppNiche({
      empresaId: cx.cliente.empresaId,
      appSku: "niche.inmo_garantia",
      clienteNombre: cx.cliente.nombre,
      telefono: cx.cliente.telefono,
      concepto: cx.observaciones ?? "Alquiler impago",
      monto: Number(cx.saldo),
      mensajeCustom: `Hola ${cx.cliente.nombre}, le recordamos que tiene un alquiler pendiente por ${monto}. Ante cualquier duda, respondanos por este medio.`,
    })

    if (ok) {
      avisados++
      await persistSistemaLog({
        empresaId: cx.cliente.empresaId,
        severidad: "info",
        categoria: "inmobiliaria",
        contexto: "inmo.alquiler_impago",
        mensaje: `WA alquiler impago CxC ${cx.id} — ${cx.cliente.nombre}`,
        metadata: { cuentaCobrarId: cx.id },
      })
    }
  }

  return { avisados }
}