import { prisma } from "@/lib/prisma"
import { getClaverAnalystEmails } from "@/lib/auth/claver-analyst"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { telegramService } from "@/lib/telegram/telegram-service"
import { getTelegramChatId } from "@/lib/telegram/telegram-vinculo"
import {
  createComercialLead,
  updateComercialLead,
  type ComercialLeadRow,
} from "@/lib/ops/comercial-pipeline-service"
import type { PipelineEtapa } from "@/lib/ops/comercial-pipeline-catalog"

function db() {
  return prisma as any
}

export type FunnelOrigen = "web" | "web_register" | "industry_demo" | "calle" | "whatsapp" | "upgrade-arca-wsp"

export type FunnelEvento =
  | "consulta_web"
  | "trial_signup"
  | "demo_rubro"
  | "lead_provisionado"
  | "upgrade_arca_certificado"

const EVENTO_LABELS: Record<FunnelEvento, string> = {
  consulta_web: "Consulta comercial web",
  trial_signup: "Nuevo trial registrado",
  demo_rubro: "Demo por rubro abierta",
  lead_provisionado: "Lead provisionado en Cloud",
  upgrade_arca_certificado: "Upgrade pendiente: certificado ARCA / WhatsApp",
}

function appUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")
  return `${base}${path}`
}

async function getAnalystChatIds(emails: string[]): Promise<string[]> {
  const chatIds: string[] = []
  for (const email of emails) {
    try {
      const usuario = await db().usuario.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true, empresaId: true },
      })
      if (usuario) {
        const chatId = await getTelegramChatId(usuario.empresaId, usuario.id)
        if (chatId) chatIds.push(chatId)
      }
    } catch {
      /* ignore */
    }
  }
  return chatIds
}

export async function notifyAnalistasFunnel(
  evento: FunnelEvento,
  lead: ComercialLeadRow,
  extra?: { empresaId?: number; tempPassword?: string },
) {
  const emails = getClaverAnalystEmails()
  if (emails.length === 0) return

  const label = EVENTO_LABELS[evento]
  const panelUrl =
    evento === "upgrade_arca_certificado"
      ? appUrl("/claver-cloud/comercial/upgrades-arca")
      : appUrl("/claver-cloud/comercial")
  const tenantUrl = extra?.empresaId ? appUrl(`/claver-cloud/tenants/${extra.empresaId}`) : null

  const filas = [
    ["Evento", label],
    ["Contacto", lead.nombre],
    ["Email", lead.email ?? "—"],
    ["Teléfono", lead.telefono ?? "—"],
    ["Negocio", lead.negocio ?? "—"],
    ["Rubro", lead.rubro ?? "—"],
    ["Origen", lead.origen],
    ["Etapa", lead.etapa],
    ...(extra?.empresaId ? [["Tenant", `#${extra.empresaId}`] as [string, string]] : []),
  ]

  const tabla = filas
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px;border:1px solid #e2e8f0;color:#64748b;width:120px;">${k}</td><td style="padding:8px;border:1px solid #e2e8f0;">${v}</td></tr>`,
    )
    .join("")

  const notasHtml = lead.notas
    ? `<p style="margin:16px 0 8px;font-size:13px;color:#64748b;">Detalle</p><p style="margin:0;white-space:pre-wrap;">${lead.notas.replace(/</g, "&lt;")}</p>`
    : ""

  const botones = [
    `<a href="${panelUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px;">Pipeline comercial</a>`,
    tenantUrl
      ? `<a href="${tenantUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Ver tenant</a>`
      : "",
  ].join("")

  void emailService.enviar({
    to: emails,
    subject: `[Claver] ${label} — ${lead.nombre}`,
    replyTo: lead.email ?? undefined,
    html: emailLayout(
      `
        <h2 style="margin:0 0 8px;font-size:18px;">${label}</h2>
        <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Registrado en Claver Cloud automáticamente.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${tabla}</table>
        ${notasHtml}
        <p style="margin:24px 0 0;">${botones}</p>
      `,
      { preheader: `${label}: ${lead.nombre}` },
    ),
  })

  try {
    const chatIds = await getAnalystChatIds(emails)
    const tg = `<b>📣 ${label}</b>\n\n<b>${lead.nombre}</b>\n${lead.email ?? ""}\n${lead.negocio ?? ""}\nOrigen: ${lead.origen} · Etapa: ${lead.etapa}${extra?.empresaId ? `\nTenant #${extra.empresaId}` : ""}`
    for (const chatId of chatIds) {
      void telegramService.sendMessage(chatId, tg, "HTML").catch(() => {})
    }
  } catch {
    /* ignore */
  }
}

export async function findLeadByEmail(email: string): Promise<ComercialLeadRow | null> {
  const row = await db().comercialPipelineLead.findFirst({
    where: { email: email.trim().toLowerCase() },
    orderBy: { updatedAt: "desc" },
  })
  if (!row) return null
  return {
    id: row.id,
    nombre: row.nombre,
    negocio: row.negocio,
    telefono: row.telefono,
    email: row.email,
    localidad: row.localidad,
    rubro: row.rubro,
    origen: row.origen,
    etapa: row.etapa,
    valorEstimado: row.valorEstimado != null ? Number(row.valorEstimado) : null,
    proximaAccion: row.proximaAccion,
    proximaFecha: row.proximaFecha ? new Date(row.proximaFecha).toISOString() : null,
    notas: row.notas,
    lat: row.lat,
    lon: row.lon,
    empresaId: row.empresaId,
    creadoPor: row.creadoPor,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }
}

export async function syncPipelineFromEvent(input: {
  nombre: string
  email: string
  negocio?: string
  telefono?: string
  rubro?: string
  origen: FunnelOrigen
  etapa?: PipelineEtapa
  empresaId?: number
  notas?: string
  proximaAccion?: string
  creadoPor?: string
  notify?: FunnelEvento
}): Promise<ComercialLeadRow> {
  const email = input.email.trim().toLowerCase()
  const existing = await findLeadByEmail(email)

  const patch = {
    nombre: input.nombre.trim(),
    negocio: input.negocio?.trim(),
    telefono: input.telefono?.trim(),
    rubro: input.rubro?.trim(),
    etapa: input.etapa ?? ("trial" as PipelineEtapa),
    empresaId: input.empresaId,
    proximaAccion: input.proximaAccion ?? "Seguimiento trial — contactar en 48 h",
    notas: input.notas,
  }

  let lead: ComercialLeadRow
  if (existing) {
    const updated = await updateComercialLead(existing.id, {
      ...patch,
      origen: existing.origen === "web" ? existing.origen : input.origen,
      notas: [existing.notas, input.notas].filter(Boolean).join("\n\n") || undefined,
    })
    lead = updated!
  } else {
    lead = await createComercialLead(
      {
        nombre: patch.nombre,
        email,
        negocio: patch.negocio,
        telefono: patch.telefono,
        rubro: patch.rubro,
        origen: input.origen,
        etapa: patch.etapa,
        proximaAccion: patch.proximaAccion,
        notas: patch.notas,
        empresaId: input.empresaId,
      },
      input.creadoPor ?? "sistema@claver.cloud",
    )
  }

  if (input.notify) {
    void notifyAnalistasFunnel(input.notify, lead, { empresaId: input.empresaId })
  }

  return lead
}