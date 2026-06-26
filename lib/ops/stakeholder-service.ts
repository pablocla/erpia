import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { STAKEHOLDER_ROLE } from "@/lib/auth/stakeholder-guard"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

function db() {
  return prisma as any
}

export async function listarStakeholders(empresaId: number) {
  return db().usuario.findMany({
    where: { empresaId, rol: STAKEHOLDER_ROLE, activo: true },
    select: { id: true, nombre: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function crearStakeholderCliente(input: {
  empresaId: number
  nombre: string
  email: string
  invitadoPor: string
  enviarEmail?: boolean
}) {
  const email = input.email.trim().toLowerCase()
  const existente = await prisma.usuario.findUnique({ where: { email } })
  if (existente) {
    if (existente.empresaId !== input.empresaId) {
      throw new Error("El email ya pertenece a otra empresa")
    }
    if (existente.rol !== STAKEHOLDER_ROLE) {
      throw new Error("El email ya existe con otro rol en el tenant")
    }
    return { usuario: existente, tempPassword: null, reenvio: true }
  }

  const tempPassword = Math.random().toString(36).slice(-10)
  const usuario = await prisma.usuario.create({
    data: {
      empresaId: input.empresaId,
      nombre: input.nombre,
      email,
      password: await hashPassword(tempPassword),
      rol: STAKEHOLDER_ROLE,
      activo: true,
    },
    select: { id: true, nombre: true, email: true, empresaId: true, rol: true },
  })

  await persistSistemaLog({
    empresaId: input.empresaId,
    categoria: "implementacion",
    contexto: "stakeholder:alta",
    severidad: "info",
    mensaje: `Stakeholder creado: ${email}`,
    metadata: { invitadoPor: input.invitadoPor, usuarioId: usuario.id },
  })

  if (input.enviarEmail !== false) {
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/claver-cliente`
    const html = emailLayout(`
      <h2>Portal de seguimiento Claver</h2>
      <p>Hola ${input.nombre}, tu acceso al seguimiento del proyecto está listo.</p>
      <p>Desde el portal podés ver el avance de implementación, tickets y servicios contratados.</p>
      <ul>
        <li><strong>URL:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
      </ul>
      <p>Cambiá la contraseña al ingresar.</p>
    `, { preheader: "Acceso portal Claver" })

    await emailService.enviar({
      to: email,
      subject: "Acceso al portal de seguimiento — Claver Cloud",
      html,
      text: `Portal: ${portalUrl} — Email: ${email} — Pass: ${tempPassword}`,
    })
  }

  return { usuario, tempPassword, reenvio: false }
}

export async function revocarStakeholder(usuarioId: number, empresaId: number) {
  const u = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId, rol: STAKEHOLDER_ROLE },
  })
  if (!u) throw new Error("Stakeholder no encontrado")
  return prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: false },
  })
}