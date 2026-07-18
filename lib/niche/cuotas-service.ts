import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import { MembresiasService } from "@/lib/membresias/membresias-service"
import { crearMovimientoNiche, listarMovimientosNiche } from "./movimientos-service"

export async function listarSociosNiche(empresaId: number, appSku: string) {
  const [membresias, movimientos] = await Promise.all([
    new MembresiasService().listarMembresias(empresaId),
    listarMovimientosNiche(empresaId, appSku, { categoria: "cuota", limit: 200 }),
  ])
  return { membresias, movimientos }
}

export async function registrarCuotaNiche(
  empresaId: number,
  appSku: string,
  input: {
    clienteId: number
    monto: number
    periodo: string
    titulo?: string
    marcarPagado?: boolean
  },
) {
  const mov = await crearMovimientoNiche(empresaId, {
    appSku,
    categoria: "cuota",
    titulo: input.titulo ?? `Cuota ${input.periodo}`,
    clienteId: input.clienteId,
    monto: input.monto,
    periodo: input.periodo,
    estado: input.marcarPagado ? "pagado" : "pendiente",
  })

  // CONVENCIÓN: saldoCuentaCorriente < 0 = DEUDA
  // Si está pagado de antemano, el saldo no cambia.
  // Si está pendiente, el cliente contrae deuda (resta a su saldo).
  if (!input.marcarPagado) {
    await prisma.cliente.update({
      where: { id: input.clienteId },
      data: { saldoCuentaCorriente: { decrement: input.monto } },
    })
  }

  return mov
}

export async function cobrarCuotaNiche(empresaId: number, movimientoId: number) {
  const mov = await prisma.nicheMovimiento.findUnique({
    where: { id: movimientoId, empresaId }
  })
  
  if (!mov || mov.estado === "pagado") return { ok: false, error: "Movimiento inválido" }

  // Al cobrar, el cliente cancela la deuda (suma a su saldo)
  await prisma.$transaction([
    prisma.nicheMovimiento.update({
      where: { id: movimientoId },
      data: { estado: "pagado" }
    }),
    prisma.cliente.update({
      where: { id: mov.clienteId! },
      data: { saldoCuentaCorriente: { increment: mov.monto } }
    })
  ])
  return { ok: true }
}

export async function listarMorososCuota(empresaId: number, appSku: string) {
  return prisma.nicheMovimiento.findMany({
    where: whereEmpresa(empresaId, { appSku, categoria: "cuota", estado: "pendiente" }),
    include: { cliente: { select: { id: true, nombre: true, telefono: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function generarCuotaMasiva(empresaId: number, appSku: string, periodo: string, monto: number) {
  const socios = await new MembresiasService().listarMembresias(empresaId)
  let count = 0
  
  for (const socio of socios) {
    if (socio.estado === "activa") {
      await registrarCuotaNiche(empresaId, appSku, {
        clienteId: socio.clienteId,
        monto,
        periodo,
        marcarPagado: false
      })
      count++
    }
  }
  return { ok: true, generadas: count }
}

export { getNicheLabels } from "./niche-labels"

/** WA a un moroso de cuota */
export async function avisarCuotaWhatsApp(
  empresaId: number,
  appSku: string,
  movimientoId: number,
) {
  const mov = await prisma.nicheMovimiento.findFirst({
    where: { id: movimientoId, empresaId, appSku },
    include: { cliente: true },
  })
  if (!mov?.cliente?.telefono) return { ok: false as const, error: "Sin teléfono" }

  const { encolarWhatsAppNiche } = await import("./niche-whatsapp")
  const { resolverLinkPagoDeudor } = await import("@/lib/mercadopago/deudor-pago-link")

  const link = await resolverLinkPagoDeudor({
    empresaId,
    clienteId: mov.clienteId!,
    clienteNombre: mov.cliente.nombre,
    monto: Number(mov.monto),
    titulo: mov.titulo,
  })

  const montoFmt = Number(mov.monto).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })
  const linkLinea = link ? ` Pagá online: ${link}` : ""
  const ok = await encolarWhatsAppNiche({
    empresaId,
    appSku,
    clienteNombre: mov.cliente.nombre,
    telefono: mov.cliente.telefono,
    concepto: mov.titulo,
    monto: Number(mov.monto),
    periodo: mov.periodo ?? undefined,
    mensajeCustom: `Hola ${mov.cliente.nombre}, recordatorio: ${mov.titulo} por ${montoFmt}.${linkLinea}`,
  })
  return ok
    ? { ok: true as const, linkPago: link }
    : { ok: false as const, error: "WhatsApp no configurado", linkPago: link }
}

export async function linkPagoCuota(empresaId: number, movimientoId: number) {
  const mov = await prisma.nicheMovimiento.findFirst({
    where: { id: movimientoId, empresaId },
    include: { cliente: true },
  })
  if (!mov?.clienteId) return { ok: false as const, error: "Sin cliente" }
  const { resolverLinkPagoDeudor } = await import("@/lib/mercadopago/deudor-pago-link")
  const link = await resolverLinkPagoDeudor({
    empresaId,
    clienteId: mov.clienteId,
    clienteNombre: mov.cliente?.nombre ?? "Cliente",
    monto: Number(mov.monto),
    titulo: mov.titulo,
    emailPagador: mov.cliente?.email,
  })
  if (!link) return { ok: false as const, error: "Mercado Pago no configurado" }
  return { ok: true as const, linkPago: link }
}