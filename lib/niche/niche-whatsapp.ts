import { prisma } from "@/lib/prisma"
import { normalizarTelefono } from "@/lib/alertas/whatsapp-regla-dispatcher"
import { getNicheAppBySku } from "./niche-apps-catalog"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

function renderPlantilla(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

export async function encolarWhatsAppNiche(input: {
  empresaId: number
  appSku: string
  clienteNombre: string
  telefono: string | null | undefined
  concepto: string
  monto?: number
  periodo?: string
  mensajeCustom?: string
}): Promise<boolean> {
  const tel = normalizarTelefono(input.telefono)
  if (!tel) return false

  const waActivo = await prisma.suscripcionModulo.findFirst({
    where: {
      empresaId: input.empresaId,
      sku: { in: ["com.whatsapp", "channel.whatsapp", "intang.cobranzas_wa"] },
      activo: true,
    },
  })
  if (!waActivo) return false

  const app = getNicheAppBySku(input.appSku)
  const texto =
    input.mensajeCustom ??
    renderPlantilla(
      app?.plantillaWhatsApp ?? "Hola {{nombre}}, {{concepto}}.",
      {
        nombre: input.clienteNombre,
        concepto: input.concepto,
        monto: input.monto != null ? fmt(input.monto) : "",
        periodo: input.periodo ?? "",
      },
    )

  await prisma.mensajePendienteWhatsApp.create({
    data: {
      empresaId: input.empresaId,
      destinatario: input.clienteNombre,
      telefono: tel,
      mensaje: texto.trim(),
      tipo: "general",
      prioridad: 6,
      estado: "aprobado",
    },
  })
  return true
}

export async function enviarWhatsAppMasivoNiche(input: {
  empresaId: number
  appSku: string
  mensaje: string
  soloPendientes?: boolean
  appId: string
}) {
  const where: {
    empresaId: number
    appSku: string
    estado?: string
    cliente: { telefono: { not: null } }
  } = {
    empresaId: input.empresaId,
    appSku: input.appSku,
    cliente: { telefono: { not: null } },
  }
  if (input.soloPendientes) where.estado = "pendiente"

  const movimientos = await prisma.nicheMovimiento.findMany({
    where,
    include: { cliente: { select: { nombre: true, telefono: true } } },
    take: 500,
  })

  let encolados = 0
  for (const m of movimientos) {
    if (!m.cliente?.telefono) continue
    const ok = await encolarWhatsAppNiche({
      empresaId: input.empresaId,
      appSku: input.appSku,
      clienteNombre: m.cliente.nombre,
      telefono: m.cliente.telefono,
      concepto: input.mensaje || m.titulo,
      monto: Number(m.monto),
      periodo: m.periodo ?? undefined,
    })
    if (ok) encolados++
  }

  const omitidos = movimientos.length - encolados
  return { encolados, omitidos, total: movimientos.length, whatsappActivo: encolados > 0 }
}