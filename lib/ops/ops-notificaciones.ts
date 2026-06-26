import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { telegramService } from "@/lib/telegram/telegram-service"
import { getTelegramChatId } from "@/lib/telegram/telegram-vinculo"
import { STAKEHOLDER_ROLE } from "@/lib/auth/stakeholder-guard"

async function resolveAnalistaEmails(empresaId: number): Promise<string[]> {
  const db = prisma as any
  const asignaciones = await db.analistaAsignacion.findMany({
    where: { empresaId, activo: true },
    select: { analistaEmail: true },
  })
  const emails = asignaciones.map((a: { analistaEmail: string }) => a.analistaEmail)
  if (emails.length === 0) {
    const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
    emails.push(...raw.split(",").map((e) => e.trim()).filter(Boolean))
  }
  return emails
}

async function getAnalystChatIds(emails: string[]): Promise<string[]> {
  const db = prisma as any
  const chatIds: string[] = []
  
  for (const email of emails) {
    try {
      const usuario = await db.usuario.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true, empresaId: true },
      })
      if (usuario) {
        const chatId = await getTelegramChatId(usuario.empresaId, usuario.id)
        if (chatId) {
          chatIds.push(chatId)
        }
      }
    } catch (err) {
      console.error(`Error resolviendo Telegram para ${email}:`, err)
    }
  }

  return chatIds
}

export async function notifyAnalistasJobFallido(input: {
  empresaId: number
  jobId: number
  tipo: string
  errorMsg: string
}) {
  const db = prisma as any
  const asignaciones = await db.analistaAsignacion.findMany({
    where: { empresaId: input.empresaId, activo: true },
    select: { analistaEmail: true },
  })

  const emails = asignaciones.map((a: { analistaEmail: string }) => a.analistaEmail)
  if (emails.length === 0) {
    const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
    emails.push(...raw.split(",").map((e) => e.trim()).filter(Boolean))
  }

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "error",
    categoria: "ops",
    contexto: `job:${input.jobId}`,
    mensaje: `Job ${input.tipo} falló: ${input.errorMsg}`,
    metadata: { notifyEmails: emails },
  })

  if (emails.length === 0) return

  // Enviar Emails
  void emailService.enviar({
    to: emails,
    subject: `[Claver Cloud] Job ${input.tipo} falló — empresa #${input.empresaId}`,
    html: `<p>Job <strong>#${input.jobId}</strong> (${input.tipo}) falló.</p><p>${input.errorMsg}</p>`,
    text: `Job #${input.jobId} (${input.tipo}) falló: ${input.errorMsg}`,
  }).catch(() => {})

  // Enviar Telegram
  try {
    const chatIds = await getAnalystChatIds(emails)
    const text = `<b>⚠️ [Claver Cloud] Job Fallido</b>\n\nJob #${input.jobId} (tipo: <b>${input.tipo}</b>) falló en empresa #${input.empresaId}.\n\n<b>Error:</b> ${input.errorMsg}`
    for (const chatId of chatIds) {
      void telegramService.sendMessage(chatId, text, "HTML").catch(() => {})
    }
  } catch (err) {
    console.error("Error enviando alertas Telegram:", err)
  }
}

export async function notifyAnalistasImplementacionAtrasada(input: {
  empresaId: number
  proyectoCodigo: string
  faseActual: string
  fechaObjetivoGoLive: Date
}) {
  const db = prisma as any
  const asignaciones = await db.analistaAsignacion.findMany({
    where: { empresaId: input.empresaId, activo: true },
    select: { analistaEmail: true },
  })

  const emails = asignaciones.map((a: { analistaEmail: string }) => a.analistaEmail)
  if (emails.length === 0) {
    const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
    emails.push(...raw.split(",").map((e) => e.trim()).filter(Boolean))
  }
  if (emails.length === 0) return

  const fecha = input.fechaObjetivoGoLive.toLocaleDateString("es-AR")
  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "warn",
    categoria: "implementacion",
    contexto: "cron:cca-atraso",
    mensaje: `Proyecto ${input.proyectoCodigo} atrasado (go-live ${fecha}, fase ${input.faseActual})`,
  })

  void emailService.enviar({
    to: emails,
    subject: `[Claver Cloud] Implementación atrasada — ${input.proyectoCodigo}`,
    html: `<p>El proyecto <strong>${input.proyectoCodigo}</strong> superó la fecha objetivo de go-live (${fecha}).</p><p>Fase actual: <strong>${input.faseActual}</strong></p>`,
    text: `Proyecto ${input.proyectoCodigo} atrasado. Go-live: ${fecha}. Fase: ${input.faseActual}`,
  }).catch(() => {})
}

export async function notifyAnalistasTicketCritico(input: {
  empresaId: number
  ticketId: number
  numero: string
  titulo: string
  descripcion: string
}) {
  const db = prisma as any
  const asignaciones = await db.analistaAsignacion.findMany({
    where: { empresaId: input.empresaId, activo: true },
    select: { analistaEmail: true },
  })

  const emails = asignaciones.map((a: { analistaEmail: string }) => a.analistaEmail)
  if (emails.length === 0) {
    const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
    emails.push(...raw.split(",").map((e) => e.trim()).filter(Boolean))
  }

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "warn",
    categoria: "ops",
    contexto: `ticket:${input.ticketId}`,
    mensaje: `Ticket crítico ${input.numero}: ${input.titulo}`,
    metadata: { notifyEmails: emails },
  })

  if (emails.length === 0) return

  // Enviar Emails
  void emailService.enviar({
    to: emails,
    subject: `[Claver Cloud] Ticket Crítico #${input.numero} — empresa #${input.empresaId}`,
    html: `<p>Se ha creado un ticket crítico <strong>#${input.numero}</strong>: ${input.titulo}</p><p>${input.descripcion}</p>`,
    text: `Ticket crítico #${input.numero}: ${input.titulo}\n\n${input.descripcion}`,
  }).catch(() => {})

  // Enviar Telegram
  try {
    const chatIds = await getAnalystChatIds(emails)
    const text = `<b>🚨 [Claver Cloud] Ticket Crítico</b>\n\nNuevo ticket crítico #${input.numero} en empresa #${input.empresaId}.\n\n<b>Título:</b> ${input.titulo}\n<b>Descripción:</b> ${input.descripcion}`
    for (const chatId of chatIds) {
      void telegramService.sendMessage(chatId, text, "HTML").catch(() => {})
    }
  } catch (err) {
    console.error("Error enviando alertas Telegram para ticket:", err)
  }
}

export async function notifyAnalistasEntornoCaido(input: {
  empresaId: number
  codigo: string
  desde: Date
}) {
  const db = prisma as any
  const asignaciones = await db.analistaAsignacion.findMany({
    where: { empresaId: input.empresaId, activo: true },
    select: { analistaEmail: true },
  })

  const emails = asignaciones.map((a: { analistaEmail: string }) => a.analistaEmail)
  if (emails.length === 0) {
    const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
    emails.push(...raw.split(",").map((e) => e.trim()).filter(Boolean))
  }

  if (emails.length === 0) return

  // Enviar Emails
  void emailService.enviar({
    to: emails,
    subject: `[Claver Cloud] Entorno ${input.codigo.toUpperCase()} Caído — empresa #${input.empresaId}`,
    html: `<p>El entorno <strong>${input.codigo.toUpperCase()}</strong> de la empresa #${input.empresaId} se encuentra en estado <strong>ERROR</strong> hace más de 1 hora.</p><p>Desde: ${input.desde.toLocaleString("es-AR")}</p>`,
    text: `Entorno ${input.codigo.toUpperCase()} caído en empresa #${input.empresaId} desde ${input.desde.toLocaleString("es-AR")}`,
  }).catch(() => {})

  // Enviar Telegram
  try {
    const chatIds = await getAnalystChatIds(emails)
    const text = `<b>🚨 [Claver Cloud] Entorno Caído</b>\n\nEl entorno <b>${input.codigo.toUpperCase()}</b> de la empresa #${input.empresaId} está en estado <b>ERROR</b> hace más de 1 hora.\n\n<b>Desde:</b> ${input.desde.toLocaleString("es-AR")}`
    for (const chatId of chatIds) {
      void telegramService.sendMessage(chatId, text, "HTML").catch(() => {})
    }
  } catch (err) {
    console.error("Error enviando alertas Telegram para entorno caído:", err)
  }
}

export async function notifyAnalistasComentarioStakeholder(input: {
  empresaId: number
  ticketId: number
  numero: string
  titulo: string
  stakeholderEmail: string
  texto: string
}) {
  const emails = await resolveAnalistaEmails(input.empresaId)

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "info",
    categoria: "soporte",
    contexto: `ticket:${input.ticketId}`,
    mensaje: `Comentario stakeholder en ${input.numero}`,
    metadata: { stakeholderEmail: input.stakeholderEmail, notifyEmails: emails },
  })

  if (emails.length === 0) return

  const excerpt = input.texto.length > 200 ? `${input.texto.slice(0, 200)}…` : input.texto
  const cloudUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/claver-cloud/operations/${input.empresaId}`

  void emailService.enviar({
    to: emails,
    subject: `[Claver Cloud] Comentario cliente — Ticket #${input.numero}`,
    html: emailLayout(`
      <h2>Nuevo comentario del cliente</h2>
      <p>El stakeholder <strong>${input.stakeholderEmail}</strong> comentó en el ticket <strong>#${input.numero}</strong> (${input.titulo}).</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;color:#444">${excerpt}</blockquote>
      <p><a href="${cloudUrl}">Ver en Claver Cloud</a></p>
    `, { preheader: `Comentario en ticket ${input.numero}` }),
    text: `Comentario de ${input.stakeholderEmail} en #${input.numero}: ${excerpt}`,
  }).catch(() => {})

  try {
    const chatIds = await getAnalystChatIds(emails)
    const text = `<b>💬 [Claver Cloud] Comentario cliente</b>\n\nTicket <b>#${input.numero}</b> — ${input.titulo}\n\n<b>De:</b> ${input.stakeholderEmail}\n<b>Mensaje:</b> ${excerpt}`
    for (const chatId of chatIds) {
      void telegramService.sendMessage(chatId, text, "HTML").catch(() => {})
    }
  } catch (err) {
    console.error("Error enviando Telegram comentario stakeholder:", err)
  }
}

export async function notifyStakeholdersRespuestaTicket(input: {
  empresaId: number
  ticketId: number
  numero: string
  titulo: string
  autorEmail: string
  texto: string
}) {
  const db = prisma as any
  const stakeholders = await db.usuario.findMany({
    where: { empresaId: input.empresaId, rol: STAKEHOLDER_ROLE, activo: true },
    select: { email: true, nombre: true },
  })
  if (stakeholders.length === 0) return

  const excerpt = input.texto.length > 200 ? `${input.texto.slice(0, 200)}…` : input.texto
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/claver-cliente/tickets/${input.ticketId}`

  for (const st of stakeholders) {
    const html = emailLayout(`
      <h2>Respuesta en tu ticket</h2>
      <p>Hola ${st.nombre}, hay una nueva respuesta en el ticket <strong>#${input.numero}</strong> (${input.titulo}).</p>
      <p><strong>${input.autorEmail}</strong> escribió:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;color:#444">${excerpt}</blockquote>
      <p><a href="${portalUrl}">Ver ticket en el portal</a></p>
    `, { preheader: `Respuesta en ticket ${input.numero}` })

    void emailService.enviar({
      to: st.email,
      subject: `Respuesta en ticket #${input.numero} — Claver`,
      html,
      text: `Nueva respuesta en #${input.numero} de ${input.autorEmail}: ${excerpt}\n\n${portalUrl}`,
    }).catch(() => {})
  }

  await persistSistemaLog({
    empresaId: input.empresaId,
    severidad: "info",
    categoria: "soporte",
    contexto: `ticket:${input.ticketId}`,
    mensaje: `Respuesta enviada a stakeholders de ${input.numero}`,
    metadata: { autor: input.autorEmail, stakeholderEmails: stakeholders.map((s: { email: string }) => s.email) },
  })
}

export async function notifyAnalistasTicketSlaBreach(input: {
  empresaId: number
  ticketId: number
  numero: string
  prioridad: string
}) {
  const db = prisma as any
  const asignaciones = await db.analistaAsignacion.findMany({
    where: { empresaId: input.empresaId, activo: true },
    select: { analistaEmail: true },
  })

  const emails = asignaciones.map((a: { analistaEmail: string }) => a.analistaEmail)
  if (emails.length === 0) {
    const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
    emails.push(...raw.split(",").map((e) => e.trim()).filter(Boolean))
  }

  if (emails.length === 0) return

  // Enviar Emails
  void emailService.enviar({
    to: emails,
    subject: `[Claver Cloud] SLA Vencido: Ticket #${input.numero} — empresa #${input.empresaId}`,
    html: `<p>El ticket <strong>#${input.numero}</strong> (prioridad: <strong>${input.prioridad}</strong>) ha vencido su tiempo de resolución de SLA.</p>`,
    text: `Ticket #${input.numero} (prioridad: ${input.prioridad}) con SLA vencido en empresa #${input.empresaId}`,
  }).catch(() => {})

  // Enviar Telegram
  try {
    const chatIds = await getAnalystChatIds(emails)
    const text = `<b>⚠️ [Claver Cloud] SLA Vencido</b>\n\nEl ticket <b>#${input.numero}</b> (prioridad: <b>${input.prioridad}</b>) de la empresa #${input.empresaId} ha superado el tiempo límite de resolución de SLA.`
    for (const chatId of chatIds) {
      void telegramService.sendMessage(chatId, text, "HTML").catch(() => {})
    }
  } catch (err) {
    console.error("Error enviando alertas Telegram para SLA vencido:", err)
  }
}