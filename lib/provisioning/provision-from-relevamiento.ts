/**
 * Provisiona un tenant listo para operar desde un relevamiento de calle.
 */

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"
import { ensureProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { getRelevamiento } from "@/lib/ops/comercial-relevamiento-service"
import { updateComercialLead } from "@/lib/ops/comercial-pipeline-service"
import {
  applyRetailOnboarding,
  type ApplyRetailOnboardingResult,
} from "@/lib/comercial/retail-onboarding-service"
import {
  inferModoLiteFromEnganche,
  resolvePackCalle,
} from "@/lib/comercial/pack-calle-catalog"
import { setSignupOrigen } from "@/lib/ops/signup-tracking"

export interface ProvisionDesdeRelevamientoInput {
  relevamientoId: number
  contactoEmail: string
  contactoNombre?: string
  cuit?: string
  analistaEmail: string
  planHosting?: string
}

export interface ProvisionDesdeRelevamientoResult {
  empresaId: number
  usuarioId: number
  tempPassword: string
  contactoEmail: string
  landingPath: string
  onboarding: ApplyRetailOnboardingResult
  appUrl: string
}

function generarCuitDemo(negocio: string): string {
  const slug = negocio.replace(/\W/g, "").slice(0, 6).toUpperCase() || "COM"
  const ts = Date.now().toString().slice(-8)
  return `DEMO-${slug}-${ts}`
}

function generarPasswordTemporal(): string {
  return Math.random().toString(36).slice(-10) + "A1!"
}

export async function provisionarDesdeRelevamiento(
  input: ProvisionDesdeRelevamientoInput,
): Promise<ProvisionDesdeRelevamientoResult> {
  const db = prisma as any
  const rel = await getRelevamiento(input.relevamientoId)
  if (!rel) throw new Error("Relevamiento no encontrado")

  if (rel.leadId) {
    const lead = await db.comercialPipelineLead.findUnique({ where: { id: rel.leadId } })
    if (lead?.empresaId) {
      throw new Error(`Este comercio ya tiene tenant #${lead.empresaId}`)
    }
  }

  const rubro = rel.rubro || "almacen"
  const engancheId = rel.engancheCandidato || "pos.fiado_barrio"
  const pack = resolvePackCalle(engancheId)
  if (pack && !pack.vendibleHoy) {
    throw new Error(`El enganche "${engancheId}" todavía no está listo para provisionar`)
  }

  const modoLite = inferModoLiteFromEnganche(engancheId, rel.dolorPrincipal)
  const contactoNombre = input.contactoNombre?.trim() || rel.nombreContacto?.trim() || rel.negocio
  const contactoEmail = input.contactoEmail.trim().toLowerCase()
  const cuit = input.cuit?.trim() || generarCuitDemo(rel.negocio)
  const tempPassword = generarPasswordTemporal()
  const passwordHash = await hashPassword(tempPassword)

  const empresa = await db.empresa.create({
    data: {
      nombre: rel.negocio.trim(),
      razonSocial: rel.negocio.trim(),
      cuit,
      email: contactoEmail,
      telefono: rel.telefono,
      direccion: rel.direccion,
      planHosting: input.planHosting || "Trial Calle",
      entornoAfip: "homologacion",
      paisFiscal: "AR",
      rubro,
      modoLite,
      temaConfig: { locale: "es-AR" },
      activo: true,
    },
  })

  await setSignupOrigen(empresa.id, "relevamiento", `relevamiento:${input.relevamientoId}`)
  await ensureTenantEntornos(empresa.id)

  const usuario = await db.usuario.create({
    data: {
      empresaId: empresa.id,
      nombre: contactoNombre,
      email: contactoEmail,
      password: passwordHash,
      rol: "admin",
      activo: true,
    },
  })

  await ensureProyectoImplementacion({
    empresaId: empresa.id,
    analistaEmail: input.analistaEmail,
    planComercial: input.planHosting || "Trial Calle",
  })

  const onboarding = await applyRetailOnboarding({
    empresaId: empresa.id,
    rubro,
    engancheId,
    modoLite,
    origen: `relevamiento:${input.relevamientoId}`,
    trialDias: 14,
  })

  if (rel.leadId) {
    await updateComercialLead(rel.leadId, {
      etapa: "provisionado",
      empresaId: empresa.id,
      email: contactoEmail,
      proximaAccion: "Acompañar primer fiado o venta",
      notas: `Provisionado tenant #${empresa.id} · ${pack?.nombre ?? engancheId}`,
    })
  }

  await db.comercialRelevamientoVisita.update({
    where: { id: input.relevamientoId },
    data: {
      trialAceptado: true,
      proximaAccion: "Acompañamiento semana 1 — primer uso",
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://erp.claver.cloud"
  const loginUrl = `${appUrl}/login`
  const destinoUrl = `${appUrl}${onboarding.landingPath}`

  const html = emailLayout(
    `
      <h2>Tu comercio ya está listo en Claver</h2>
      <p>Hola <strong>${contactoNombre}</strong>, configuramos <strong>${rel.negocio}</strong> con <strong>${pack?.nombre ?? "Libreta Fiado"}</strong>.</p>
      <p>En menos de 10 minutos podés anotar el primer fiado o la primera venta.</p>
      <ul>
        <li><strong>Entrar:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
        <li><strong>Email:</strong> ${contactoEmail}</li>
        <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
        <li><strong>Ir directo a:</strong> <a href="${destinoUrl}">${pack?.nombre ?? "tu libreta"}</a></li>
      </ul>
      <p>Trial 14 días. Cualquier duda, respondé este mail o WhatsApp.</p>
    `,
    { preheader: `${rel.negocio} — ya podés operar sin cuaderno` },
  )

  await emailService.enviar({
    to: contactoEmail,
    subject: `${rel.negocio} — tu libreta digital ya está lista`,
    html,
    text: `Claver listo. URL: ${loginUrl} · Email: ${contactoEmail} · Pass: ${tempPassword} · Ir a: ${destinoUrl}`,
  }).catch((err) => console.warn("[provision-relevamiento] Email no enviado:", err))

  return {
    empresaId: empresa.id,
    usuarioId: usuario.id,
    tempPassword,
    contactoEmail,
    landingPath: onboarding.landingPath,
    onboarding,
    appUrl,
  }
}