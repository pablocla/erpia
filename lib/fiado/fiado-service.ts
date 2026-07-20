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
  | { ok: true; disponible: number; deudaActual: number; error?: never }
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

/** Baja deuda en libreta (saldoCuentaCorriente sube hacia 0). */
export async function reducirDeudaCliente(
  tx: Prisma.TransactionClient,
  clienteId: number,
  montoCobrado: number,
): Promise<number> {
  const cliente = await tx.cliente.findUnique({
    where: { id: clienteId },
    select: { saldoCuentaCorriente: true },
  })
  if (!cliente) throw new Error("Cliente no encontrado")

  const saldoActual = Number(cliente.saldoCuentaCorriente)
  // saldo negativo = deuda; sumar cobro acerca a cero (no pasar a crédito positivo salvo resto)
  const nuevoSaldo = saldoActual + montoCobrado
  await tx.cliente.update({
    where: { id: clienteId },
    data: { saldoCuentaCorriente: nuevoSaldo },
  })
  return nuevoSaldo
}

export type AnotarFiadoResult = {
  ok: true
  clienteId: number
  monto: number
  deuda: number
  cuentaCobrarId: number
  saldoCuentaCorriente: number
}

/**
 * Anota fiado desde la libreta (sin POS).
 * Crea CuentaCobrar cobrable + sube deuda del cliente.
 */
export async function anotarFiadoLibreta(input: {
  empresaId: number
  clienteId: number
  monto: number
  concepto?: string
  diasVencimiento?: number
}): Promise<AnotarFiadoResult | { ok: false; error: string }> {
  const monto = Math.round(Number(input.monto) * 100) / 100
  if (!Number.isFinite(monto) || monto <= 0) {
    return { ok: false, error: "El monto debe ser mayor a cero" }
  }

  const validacion = await validarFiadoPos(input.empresaId, input.clienteId, monto)
  if (!validacion.ok) return { ok: false, error: validacion.error }

  const concepto = (input.concepto?.trim() || "Fiado libreta").slice(0, 200)
  const dias = input.diasVencimiento ?? 0
  const hoy = new Date()
  const vencimiento = new Date(hoy)
  vencimiento.setDate(vencimiento.getDate() + Math.max(0, dias))

  const result = await prisma.$transaction(async (tx) => {
    const saldoNuevo = await incrementarDeudaCliente(tx, input.clienteId, monto)
    const cc = await tx.cuentaCobrar.create({
      data: {
        clienteId: input.clienteId,
        facturaId: null,
        montoOriginal: monto,
        montoPagado: 0,
        saldo: monto,
        fechaEmision: hoy,
        fechaVencimiento: vencimiento,
        estado: "pendiente",
        observaciones: concepto,
      },
    })
    return { saldoNuevo, cuentaCobrarId: cc.id }
  })

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "info",
    categoria: "FIADO",
    contexto: "anotar_fiado",
    mensaje: `Fiado libreta $${monto} cliente #${input.clienteId}`,
    metadata: {
      modulo: "fiado",
      clienteId: input.clienteId,
      cuentaCobrarId: result.cuentaCobrarId,
      monto,
    },
  })

  // Notificación liviana (sin factura fiscal)
  void enviarNotificacionFiado({
    empresaId: input.empresaId,
    clienteId: input.clienteId,
    facturaId: 0,
    cuentaCobrarId: result.cuentaCobrarId,
    numeroCompleto: `FIADO-${result.cuentaCobrarId}`,
    lineas: [{ descripcion: concepto, cantidad: 1, total: monto }],
    totalVenta: monto,
    saldoNuevo: result.saldoNuevo,
  }).catch((err) => console.error("[Fiado] Notificación anotar:", err))

  return {
    ok: true,
    clienteId: input.clienteId,
    monto,
    deuda: deudaCliente(result.saldoNuevo),
    cuentaCobrarId: result.cuentaCobrarId,
    saldoCuentaCorriente: result.saldoNuevo,
  }
}

export type CobrarFiadoResult = {
  ok: true
  clienteId: number
  monto: number
  deudaRestante: number
  reciboId: number
  reciboNumero: string
  cuentasAplicadas: number[]
}

/**
 * Cobra fiado desde la libreta: baja saldo cliente + aplica a CC abiertas (FIFO) + Recibo.
 */
export async function cobrarFiadoLibreta(input: {
  empresaId: number
  clienteId: number
  monto: number
  medioPago?: "efectivo" | "transferencia" | "tarjeta" | "cheque"
  observaciones?: string
}): Promise<CobrarFiadoResult | { ok: false; error: string }> {
  const acceso = await canUseSku(input.empresaId, "pos.fiado_barrio")
  if (!acceso.ok) {
    return { ok: false, error: "Activá Libreta Fiado para registrar cobros." }
  }

  const monto = Math.round(Number(input.monto) * 100) / 100
  if (!Number.isFinite(monto) || monto <= 0) {
    return { ok: false, error: "El monto debe ser mayor a cero" }
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: input.clienteId, empresaId: input.empresaId },
    select: { id: true, nombre: true, saldoCuentaCorriente: true, fiadoHabilitado: true },
  })
  if (!cliente) return { ok: false, error: "Cliente no encontrado" }

  const deuda = deudaCliente(cliente.saldoCuentaCorriente)
  if (deuda <= 0) return { ok: false, error: "El cliente no tiene deuda de fiado" }
  if (monto > deuda + 0.01) {
    return { ok: false, error: `El cobro ($${monto}) supera la deuda ($${deuda})` }
  }

  const medio = input.medioPago ?? "efectivo"
  const hoy = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const ccs = await tx.cuentaCobrar.findMany({
      where: {
        clienteId: input.clienteId,
        estado: { in: ["pendiente", "vencida", "parcial"] },
        saldo: { gt: 0 },
      },
      orderBy: [{ fechaVencimiento: "asc" }, { id: "asc" }],
    })

    let restante = monto
    const items: { cuentaCobrarId: number; monto: number }[] = []

    for (const cc of ccs) {
      if (restante <= 0) break
      const saldoCc = Number(cc.saldo)
      const aplica = Math.min(saldoCc, restante)
      if (aplica <= 0) continue
      items.push({ cuentaCobrarId: cc.id, monto: Math.round(aplica * 100) / 100 })
      restante = Math.round((restante - aplica) * 100) / 100
    }

    // Si no hay CC abiertas pero sí deuda de libreta: crear CC residual y aplicarla
    if (items.length === 0) {
      const cc = await tx.cuentaCobrar.create({
        data: {
          clienteId: input.clienteId,
          montoOriginal: monto,
          montoPagado: 0,
          saldo: monto,
          fechaEmision: hoy,
          fechaVencimiento: hoy,
          estado: "pendiente",
          observaciones: "Ajuste cobro fiado sin CC previa",
        },
      })
      items.push({ cuentaCobrarId: cc.id, monto })
    } else if (restante > 0.01) {
      // Deuda libreta mayor que suma de CC: CC residual por el resto
      const cc = await tx.cuentaCobrar.create({
        data: {
          clienteId: input.clienteId,
          montoOriginal: restante,
          montoPagado: 0,
          saldo: restante,
          fechaEmision: hoy,
          fechaVencimiento: hoy,
          estado: "pendiente",
          observaciones: "Ajuste cobro fiado — diferencia libreta vs CC",
        },
      })
      items.push({ cuentaCobrarId: cc.id, monto: restante })
    }

    const ultimo = await tx.recibo.findFirst({
      where: { cliente: { empresaId: input.empresaId } },
      orderBy: { id: "desc" },
    })
    const numero = `REC-FIADO-${String((ultimo?.id ?? 0) + 1).padStart(6, "0")}`

    const recibo = await tx.recibo.create({
      data: {
        numero,
        fecha: hoy,
        montoTotal: monto,
        medioPago: medio,
        netoRecibido: monto,
        totalRetenciones: 0,
        observaciones: input.observaciones ?? "Cobro libreta fiado",
        clienteId: input.clienteId,
        items: {
          create: items.map((i) => ({
            montoPagado: i.monto,
            cuentaCobrarId: i.cuentaCobrarId,
          })),
        },
        mediosPago: {
          create: [{ tipo: medio, monto }],
        },
      },
    })

    for (const item of items) {
      const cc = await tx.cuentaCobrar.findUnique({ where: { id: item.cuentaCobrarId } })
      if (!cc) continue
      const nuevoSaldo = Math.round((Number(cc.saldo) - item.monto) * 100) / 100
      const nuevoPagado = Math.round((Number(cc.montoPagado) + item.monto) * 100) / 100
      await tx.cuentaCobrar.update({
        where: { id: item.cuentaCobrarId },
        data: {
          montoPagado: nuevoPagado,
          saldo: Math.max(0, nuevoSaldo),
          estado: nuevoSaldo <= 0.009 ? "pagada" : "parcial",
        },
      })
    }

    const saldoNuevo = await reducirDeudaCliente(tx, input.clienteId, monto)

    return {
      reciboId: recibo.id,
      reciboNumero: numero,
      cuentasAplicadas: items.map((i) => i.cuentaCobrarId),
      saldoNuevo,
    }
  })

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "info",
    categoria: "FIADO",
    contexto: "cobrar_fiado",
    mensaje: `Cobro fiado $${monto} cliente #${input.clienteId} → ${result.reciboNumero}`,
    metadata: {
      modulo: "fiado",
      clienteId: input.clienteId,
      reciboId: result.reciboId,
      monto,
    },
  })

  void import("@/lib/cobranza/as-a-service")
    .then(({ registrarFeePorCobroRecuperado }) =>
      registrarFeePorCobroRecuperado({
        empresaId: input.empresaId,
        montoRecuperado: monto,
        reciboId: result.reciboId,
      }),
    )
    .catch((err) => console.warn("[cobranza-aas] fee fiado:", err))

  return {
    ok: true,
    clienteId: input.clienteId,
    monto,
    deudaRestante: deudaCliente(result.saldoNuevo),
    reciboId: result.reciboId,
    reciboNumero: result.reciboNumero,
    cuentasAplicadas: result.cuentasAplicadas,
  }
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
    const disponibleRaw = calcularCreditoDisponible(limite, Number(c.saldoCuentaCorriente))
    return {
      ...c,
      limiteCredito: limite,
      saldoCuentaCorriente: Number(c.saldoCuentaCorriente),
      deuda,
      // JSON-safe (Infinity → null no viaja bien)
      disponible: Number.isFinite(disponibleRaw) ? disponibleRaw : 999999999,
    }
  })
}



export async function provisionFiado(empresaId: number) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [deudores, fiadosHoy] = await Promise.all([
    listarDeudoresFiado(empresaId, true),
    prisma.factura.count({
      where: {
        empresaId,
        createdAt: { gte: hoy },
        cuentasCobrar: { some: {} },
      },
    }),
  ])
  
  const notificacionesHoy = 0

  const saldoFiadoTotal = deudores.reduce((acc: any, d: any) => acc + d.deuda, 0)

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

  const [deudores, fiadosHoy] = await Promise.all([
    listarDeudoresFiado(empresaId, true),
    prisma.factura.count({
      where: {
        empresaId,
        createdAt: { gte: hoy },
        cuentasCobrar: { some: {} },
      },
    }),
  ])
  
  const notificacionesHoy = 0

  const saldoFiadoTotal = deudores.reduce((acc: any, d: any) => acc + d.deuda, 0)

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

  const notificacionLogPromise = Promise.resolve() // Removido para evitar 500, no existe el modelo

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
    categoria: "FIADO",
    contexto: "notificar_fiado",
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