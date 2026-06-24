/**
 * Encola mensajes WhatsApp cuando una regla configurable se dispara.
 * - cxc_vencida → clientes deudores (pendiente de aprobación)
 * - resto → equipo interno (auto-aprobado si está configurado)
 */

import { prisma } from "@/lib/prisma"
import { getIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"

export interface ReglaWhatsAppContext {
  titulo: string
  mensaje: string
  prioridad: "alta" | "media" | "baja"
  diasVencida?: number
}

function prioridadNumerica(p: "alta" | "media" | "baja"): number {
  if (p === "alta") return 9
  if (p === "media") return 7
  return 5
}

export function normalizarTelefono(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const digits = raw.replace(/\D/g, "")
  if (digits.length < 8) return null
  if (digits.startsWith("54")) return `+${digits}`
  if (digits.startsWith("0")) return `+54${digits.slice(1)}`
  if (digits.length === 10) return `+54${digits}`
  return `+${digits}`
}

async function resolverTelefonoInterno(
  empresaId: number,
  destinatarioId: number | null,
  telefonoDestino?: string,
): Promise<{ telefono: string; nombre: string } | null> {
  const directo = normalizarTelefono(telefonoDestino)
  if (directo) return { telefono: directo, nombre: "Equipo" }

  if (!destinatarioId) return null

  const empleado = await prisma.empleado.findFirst({
    where: { empresaId, usuarioId: destinatarioId, estado: "activo" },
    select: { telefono: true, nombre: true },
  })
  const telEmp = normalizarTelefono(empleado?.telefono)
  if (telEmp) return { telefono: telEmp, nombre: empleado!.nombre }

  const usuario = await prisma.usuario.findFirst({
    where: { id: destinatarioId, empresaId },
    select: { nombre: true, email: true },
  })
  return null
}

/** Teléfono WA de un usuario interno (vía ficha de empleado). */
export async function resolverTelefonoUsuario(
  empresaId: number,
  usuarioId: number,
): Promise<{ telefono: string; nombre: string } | null> {
  return resolverTelefonoInterno(empresaId, usuarioId, undefined)
}

async function encolarCobranzaClientes(
  empresaId: number,
  reglaNombre: string,
  diasVencida: number,
  maxClientes: number,
  autoAprobar: boolean,
): Promise<number> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { nombre: true },
  })

  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() - diasVencida)

  const cuentas = await prisma.cuentaCobrar.findMany({
    where: {
      estado: { in: ["pendiente", "vencida", "parcial"] },
      fechaVencimiento: { lt: fechaLimite },
      cliente: { empresaId },
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, telefonoAlternativo: true } },
    },
    take: maxClientes * 2,
  })

  const porCliente = new Map<number, {
    nombre: string
    telefono: string
    saldo: number
    dias: number
  }>()

  const hoy = Date.now()
  for (const cc of cuentas) {
    const tel = normalizarTelefono(cc.cliente.telefono) ?? normalizarTelefono(cc.cliente.telefonoAlternativo)
    if (!tel) continue

    const dias = Math.floor((hoy - cc.fechaVencimiento.getTime()) / 86_400_000)
    const prev = porCliente.get(cc.cliente.id)
    const saldo = Number(cc.saldo)
    if (prev) {
      prev.saldo += saldo
      prev.dias = Math.max(prev.dias, dias)
    } else {
      porCliente.set(cc.cliente.id, { nombre: cc.cliente.nombre, telefono: tel, saldo, dias })
    }
  }

  let encolados = 0
  for (const c of porCliente.values()) {
    if (encolados >= maxClientes) break

    const monto = c.saldo.toLocaleString("es-AR", { maximumFractionDigits: 0 })
    const texto = `Hola ${c.nombre}, le escribimos de ${empresa?.nombre ?? "nuestro negocio"}. Registramos un saldo pendiente de $${monto} con ${c.dias} días de vencimiento. ¿Podemos coordinar el pago? Gracias.`

    await prisma.mensajePendienteWhatsApp.create({
      data: {
        empresaId,
        destinatario: c.nombre,
        telefono: c.telefono,
        mensaje: texto,
        tipo: "cobranza",
        prioridad: 9,
        estado: autoAprobar ? "aprobado" : "pendiente",
      },
    })
    encolados++
  }

  return encolados
}

/**
 * Encola mensajes WA según tipo de regla. Retorna cantidad encolada.
 */
export async function encolarWhatsAppDesdeRegla(
  empresaId: number,
  regla: {
    id: number
    nombre: string
    tipoRegla: string
    destinatarioId: number | null
    condicion: string
  },
  ctx: ReglaWhatsAppContext,
): Promise<number> {
  const condicion = JSON.parse(regla.condicion) as { telefonoDestino?: string; valor?: number }
  const config = await getIANotificacionConfig(empresaId)

  if (regla.tipoRegla === "cxc_vencida") {
    const dias = ctx.diasVencida ?? (Number(condicion.valor) || 30)
    return encolarCobranzaClientes(
      empresaId,
      regla.nombre,
      dias,
      config.whatsappCobranzaMaxPorRegla ?? 5,
      config.whatsappCobranzaAutoAprobar === true,
    )
  }

  const interno = await resolverTelefonoInterno(
    empresaId,
    regla.destinatarioId,
    condicion.telefonoDestino,
  )
  if (!interno) {
    console.warn(`[WA Regla] Sin teléfono para regla ${regla.id} (${regla.nombre})`)
    return 0
  }

  const autoAprobar = config.whatsappReglasAutoAprobar !== false
  await prisma.mensajePendienteWhatsApp.create({
    data: {
      empresaId,
      destinatario: interno.nombre,
      telefono: interno.telefono,
      mensaje: `🔔 *${ctx.titulo}*\n\n${ctx.mensaje}\n\n— Cleverp`,
      tipo: "general",
      prioridad: prioridadNumerica(ctx.prioridad),
      estado: autoAprobar ? "aprobado" : "pendiente",
    },
  })

  return 1
}