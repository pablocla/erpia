/**
 * Libreta Fiado — almacenes de barrio
 * Convención saldo: saldoCuentaCorriente < 0 = deuda del cliente
 */

import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/email/email-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { emailFiadoNotificacion } from "./fiado-email-templates"
import { resolverLinkPagoFiado } from "./fiado-pago-link"
import { encolarWhatsAppFiado } from "./fiado-whatsapp"
import { canUseSku } from "@/lib/platform/entitlements"

export function deudaCliente(saldoCuentaCorriente: number | Prisma.Decimal): number {
  const saldo = Number(saldoCuentaCorriente)
  return saldo < 0 ? Math.abs(saldo) : 0
}

export function calcularCreditoDisponible(limiteCredito: number, saldoCuentaCorriente: number): number {
  const limite = Number(limiteCredito)
  if (limite <= 0) return Infinity
  return Math.max(0, limite - deudaCliente(saldoCuentaCorriente))
}

export type ValidarFiadoResult =
  | { ok: true; disponible: number; deudaActual: number }
  | { ok: false; error: string; deudaActual?: number; limite?: number; disponible?: number }

export async function validarFiadoPos(
  empresaId: number,
  clienteId: number,
  montoFiado: number,
): Promise<ValidarFiadoResult> {
  const acceso = await canUseSku(empresaId, "pos.fiado_barrio")
  if (!acceso.ok) {
    return {
      ok: false,
      error: "Activá Libreta Fiado desde la App Store para vender a fiado.",
    }
  }

  const [cliente, empresa] = await Promise.all([
    prisma.cliente.findFirst({
      where: { id: clienteId, empresaId },
      select: {
        fiadoHabilitado: true,
        limiteCredito: true,
        saldoCuentaCorriente: true,
        nombre: true,
      },
    }),
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { fiadoRequiereLimite: true },
    }),
  ])

  if (!cliente) return { ok: false, error: "Cliente no encontrado" }
  if (!cliente.fiadoHabilitado) {
    return { ok: false, error: "Cliente sin fiado habilitado. Activá Libreta Fiado en el cliente." }
  }

  const limite = Number(cliente.limiteCredito)
  const deudaActual = deudaCliente(cliente.saldoCuentaCorriente)
  const disponible = calcularCreditoDisponible(limite, Number(cliente.saldoCuentaCorriente))

  if (empresa?.fiadoRequiereLimite !== false && limite <= 0) {
    return {
      ok: false,
      error: "Configurá un límite de crédito mayor a cero para este cliente",
      deudaActual,
      limite: 0,
      disponible: 0,
    }
  }

  if (limite > 0 && deudaActual + montoFiado > limite) {
    return {
      ok: false,
      error: `Límite de crédito excedido para ${cliente.nombre}`,
      deudaActual,
      limite,
      disponible,
    }
  }

  return { ok: true, disponible, deudaActual }
}

export async function incrementarDeudaCliente(
  tx: Prisma.TransactionClient,
  clienteId: number,
  montoFiado: number,
): Promise<number> {
  const cliente = await tx.cliente.findUnique({
    where: { id: clienteId },
    select: { saldoCuentaCorriente: true },
  })
  if (!cliente) throw new Error("Cliente no encontrado")

  const saldoActual = Number(cliente.saldoCuentaCorriente)
  const nuevoSaldo = saldoActual - montoFiado

  await tx.cliente.update({
    where: { id: clienteId },
    data: { saldoCuentaCorriente: nuevoSaldo },
  })

  return nuevoSaldo
}

export async function listarDeudoresFiado(empresaId: number, soloConSaldo = true) {
  const clientes = await prisma.cliente.findMany({
    where: {
      empresaId,
      fiadoHabilitado: true,
      ...(soloConSaldo ? { saldoCuentaCorriente: { lt: 0 } } : {}),
    },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
      limiteCredito: true,
      saldoCuentaCorriente: true,
      emailNotificacionFiado: true,
      updatedAt: true,
    },
    orderBy: { saldoCuentaCorriente: "asc" },
  })

  return clientes.map((c) => {
    const deuda = deudaCliente(c.saldoCuentaCorriente)
    const limite = Number(c.limiteCredito)
    return {
      ...c,
      limiteCredito: limite,
      saldoCuentaCorriente: Number(c.saldoCuentaCorriente),
      deuda,
      disponible: calcularCreditoDisponible(limite, Number(c.saldoCuentaCorriente)),
    }
  })
}

import { ErrorLogger } from "../utils/error-logger"

export async function provisionFiado(empresaId: number) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [deudores, fiadosHoy, notificacionesHoy] = await Promise.all([
    listarDeudoresFiado(empresaId, true),
    prisma.factura.count({
      where: {
        empresaId,
        createdAt: { gte: hoy },
        cuentasCobrar: { some: {} },
      },
    }),
    prisma.fiadoNotificacionLog.count({
      where: { empresaId, createdAt: { gte: hoy }, estado: "enviado" },
    }),
  ])

  const saldoFiadoTotal = deudores.reduce((acc, d) => acc + d.deuda, 0)

  return {
    totalDeudores: deudores.length,
    saldoFiadoTotal,
    fiadosHoy,
    notificacionesHoy,
  }
}

export async function resumenFiado(empresaId: number) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [deudores, fiadosHoy, notificacionesHoy] = await Promise.all([
    listarDeudoresFiado(empresaId, true),
    prisma.factura.count({
      where: {
        empresaId,
        createdAt: { gte: hoy },
        cuentasCobrar: { some: {} },
      },
    }),
    prisma.fiadoNotificacionLog.count({
      where: { empresaId, createdAt: { gte: hoy }, estado: "enviado" },
    }),
  ])

  const saldoFiadoTotal = deudores.reduce((acc, d) => acc + d.deuda, 0)

  return {
    totalDeudores: deudores.length,
    saldoFiadoTotal,
    fiadosHoy,
    notificacionesHoy,
  }
}

export async function enviarNotificacionFiado(input: {
  empresaId: number
  clienteId: number
  facturaId: number
  cuentaCobrarId?: number
  numeroCompleto: string
  lineas: { descripcion: string; cantidad: number; total: number }[]
  totalVenta: number
  saldoNuevo: number
}) {
  const [cliente, empresa] = await Promise.all([
    prisma.cliente.findFirst({
      where: { id: input.clienteId, empresaId: input.empresaId },
      select: {
        nombre: true,
        email: true,
        telefono: true,
        limiteCredito: true,
        emailNotificacionFiado: true,
        emailNotificacionFiado2: true,
        notificarClienteFiado: true,
      },
    }),
    prisma.empresa.findUnique({
      where: { id: input.empresaId },
      select: { nombre: true, emailDuenoAlmacen: true, email: true, fiadoNotificarWhatsApp: true },
    }),
  ])

  if (!cliente || !empresa) return { enviados: 0, estado: "omitido" as const }

  const destinatarios = new Set<string>()
  if (cliente.emailNotificacionFiado?.trim()) destinatarios.add(cliente.emailNotificacionFiado.trim())
  if (cliente.emailNotificacionFiado2?.trim()) destinatarios.add(cliente.emailNotificacionFiado2.trim())
  if (cliente.notificarClienteFiado && cliente.email?.trim()) destinatarios.add(cliente.email.trim())
  if (empresa.emailDuenoAlmacen?.trim()) destinatarios.add(empresa.emailDuenoAlmacen.trim())

  const deuda = deudaCliente(input.saldoNuevo)
  const limite = Number(cliente.limiteCredito)
  const disponible = calcularCreditoDisponible(limite, input.saldoNuevo)

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

  const linkPago = await resolverLinkPagoFiado({
    empresaId: input.empresaId,
    clienteId: input.clienteId,
    clienteNombre: cliente.nombre,
    monto: input.totalVenta,
    facturaId: input.facturaId,
    cuentaCobrarId: input.cuentaCobrarId,
    emailPagador: cliente.email,
  })

  const html = emailFiadoNotificacion({
    almacen: empresa.nombre,
    clienteNombre: cliente.nombre,
    numeroCompleto: input.numeroCompleto,
    lineas: input.lineas,
    totalVenta: input.totalVenta,
    deudaTotal: deuda,
    creditoDisponible: disponible === Infinity ? null : disponible,
    linkPago,
    fmt,
  })

  const subject = `[Libreta Fiado] ${cliente.nombre} compró ${fmt(input.totalVenta)} — Deuda ${fmt(deuda)}`

  let enviados = 0
  let estado = destinatarios.size === 0 ? "omitido_smtp" : "enviado"

  if (destinatarios.size > 0) {
    for (const to of destinatarios) {
      const res = await emailService.enviar({
        to,
        subject,
        html,
        text: `${cliente.nombre} fiado ${fmt(input.totalVenta)}. Deuda total: ${fmt(deuda)}${linkPago ? ` Pagá: ${linkPago}` : ""}`,
      })
      if (res.ok) enviados++
      else estado = "fallido"
    }
  }

  await prisma.fiadoNotificacionLog.create({
    data: {
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      facturaId: input.facturaId,
      destinatarios: [...destinatarios],
      estado,
    },
  })

  const whatsapp = await encolarWhatsAppFiado({
    empresaId: input.empresaId,
    clienteNombre: cliente.nombre,
    telefono: cliente.telefono,
    totalVenta: input.totalVenta,
    deudaTotal: deuda,
    linkPago,
    almacenNombre: empresa.nombre,
  })

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "info",
    mensaje: `Notificación fiado ${input.numeroCompleto} → email:${enviados} wa:${whatsapp ? "si" : "no"}`,
    metadata: { facturaId: input.facturaId, clienteId: input.clienteId, linkPago: !!linkPago, modulo: "fiado" },
  })

  return { enviados, estado, linkPago: linkPago ?? undefined, whatsapp }
}

export async function obtenerConfigFiado(empresaId: number) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      emailDuenoAlmacen: true,
      fiadoRequiereLimite: true,
      fiadoNotificarWhatsApp: true,
      email: true,
      nombre: true,
    },
  })
  return empresa
}

export async function guardarConfigFiado(
  empresaId: number,
  data: {
    emailDuenoAlmacen?: string | null
    fiadoRequiereLimite?: boolean
    fiadoNotificarWhatsApp?: boolean
  },
) {
  return prisma.empresa.update({
    where: { id: empresaId },
    data: {
      emailDuenoAlmacen: data.emailDuenoAlmacen ?? undefined,
      fiadoRequiereLimite: data.fiadoRequiereLimite,
      fiadoNotificarWhatsApp: data.fiadoNotificarWhatsApp,
    },
    select: {
      emailDuenoAlmacen: true,
      fiadoRequiereLimite: true,
      fiadoNotificarWhatsApp: true,
    },
  })
}