/**
 * ED-16: inbound WhatsApp — "ya pagué" / ver deuda → tarea HITL (no auto-cierra).
 */

import { prisma } from "@/lib/prisma"
import { isLeoActivo } from "./is-leo-activo"
import { LEO_COBRANZA_CODE } from "./types"

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null
  const d = value.replace(/[^0-9]/g, "")
  return d.length >= 8 ? d : null
}

export type InboundWaResult =
  | { handled: false; reason: string }
  | {
      handled: true
      action: "ya_pague" | "ver_deuda" | "unknown_fiado"
      tareaId?: string
      message: string
    }

/**
 * Procesa body de WA entrante. Si no es cobranza/fiado, handled=false (sigue flujo turnos).
 */
export async function handleLeoInboundWhatsApp(input: {
  empresaId: number
  fromPhone: string
  body: string
}): Promise<InboundWaResult> {
  const body = input.body.trim().toLowerCase()
  const isYaPague =
    body.includes("ya pague") ||
    body.includes("ya pagué") ||
    body.includes("yapague") ||
    body.includes("pague") ||
    body.includes("pagué") ||
    body.includes("fiado_ya_pague") ||
    body === "1"
  const isVerDeuda =
    body.includes("ver deuda") ||
    body.includes("saldo") ||
    body.includes("fiado_ver_deuda") ||
    body === "2"

  if (!isYaPague && !isVerDeuda) {
    return { handled: false, reason: "not_leo_intent" }
  }

  if (!(await isLeoActivo(input.empresaId))) {
    return { handled: false, reason: "leo_inactive" }
  }

  const from = normalizePhone(input.fromPhone)
  if (!from) return { handled: false, reason: "bad_phone" }

  const clientes = await prisma.cliente.findMany({
    where: {
      empresaId: input.empresaId,
      activo: true,
      deletedAt: null,
      OR: [
        { telefono: { contains: from.slice(-8) } },
        { telefonoAlternativo: { contains: from.slice(-8) } },
      ],
    },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      saldoCuentaCorriente: true,
    },
    take: 5,
  })

  const cliente = clientes[0]
  if (!cliente) {
    return {
      handled: true,
      action: "unknown_fiado",
      message: "No encontramos tu ficha de cliente con ese número. Acercate al local.",
    }
  }

  const empleado = await prisma.empleadoDigital.findFirst({
    where: {
      empresaId: input.empresaId,
      estado: { in: ["activo", "trial"] },
      template: { code: LEO_COBRANZA_CODE },
    },
    select: { id: true },
  })
  if (!empleado) {
    return { handled: false, reason: "no_empleado" }
  }

  const deuda = Math.max(0, -Number(cliente.saldoCuentaCorriente))

  if (isVerDeuda) {
    const mensaje =
      deuda > 0
        ? `${cliente.nombre}, tu saldo de fiado/deuda registrada es ${deuda.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}. Si ya pagaste, respondé YA PAGUE.`
        : `${cliente.nombre}, no registramos deuda pendiente. ¡Gracias!`

    await prisma.mensajePendienteWhatsApp.create({
      data: {
        empresaId: input.empresaId,
        destinatario: cliente.nombre,
        telefono: normalizePhone(cliente.telefono) || from,
        mensaje,
        tipo: "fiado_consulta",
        prioridad: 6,
        estado: "aprobado",
      },
    })

    return {
      handled: true,
      action: "ver_deuda",
      message: "Consulta de saldo encolada",
    }
  }

  // ya pagué → tarea HITL para que el dueño verifique (NO cierra deuda solo)
  const tarea = await prisma.empleadoDigitalTarea.create({
    data: {
      empresaId: input.empresaId,
      empleadoDigitalId: empleado.id,
      tipo: "verificar_pago",
      estado: "pendiente",
      prioridad: 9,
      clienteId: cliente.id,
      montoArs: deuda > 0 ? deuda : null,
      telefono: cliente.telefono || from,
      mensaje: `El cliente ${cliente.nombre} respondió por WhatsApp que YA PAGÓ. Verificá el cobro y actualizá la cuenta. Deuda registrada al momento: ${deuda.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}.`,
      origenMensaje: "manual",
      payload: {
        inbound: true,
        intent: "ya_pague",
        bodyOriginal: input.body.slice(0, 200),
        fromPhone: from,
      },
    },
  })

  // Aviso al cliente: recibimos el aviso, el local verifica
  await prisma.mensajePendienteWhatsApp.create({
    data: {
      empresaId: input.empresaId,
      destinatario: cliente.nombre,
      telefono: normalizePhone(cliente.telefono) || from,
      mensaje: `Recibimos tu aviso de pago, ${cliente.nombre}. El comercio lo va a verificar y actualizará tu cuenta. ¡Gracias!`,
      tipo: "fiado_ack",
      prioridad: 6,
      estado: "aprobado",
    },
  })

  void import("./agent-notify")
    .then(({ notifyLeoVerificarPago }) =>
      notifyLeoVerificarPago({
        empresaId: input.empresaId,
        clienteNombre: cliente.nombre,
        monto: deuda > 0 ? deuda : undefined,
        tareaId: String(tarea.id),
      }),
    )
    .catch(() => {})

  return {
    handled: true,
    action: "ya_pague",
    tareaId: String(tarea.id),
    message: "Tarea de verificación creada (HITL)",
  }
}
