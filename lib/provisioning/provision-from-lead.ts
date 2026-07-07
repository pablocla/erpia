/**
 * Provisiona tenant desde un lead del pipeline comercial.
 */

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"
import { ensureProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { updateComercialLead } from "@/lib/ops/comercial-pipeline-service"
import { notifyAnalistasFunnel } from "@/lib/comercial/comercial-funnel-service"
import {
  applyRetailOnboarding,
  type ApplyRetailOnboardingResult,
} from "@/lib/comercial/retail-onboarding-service"
import {
  inferModoLiteFromEnganche,
  resolvePackCalle,
} from "@/lib/comercial/pack-calle-catalog"
import { setSignupOrigen } from "@/lib/ops/signup-tracking"
import { PACK_PROPIEDAD } from "@/lib/comercial/hybrid-provision-bridge"

export interface ProvisionDesdeLeadInput {
  leadId: number
  contactoEmail: string
  contactoNombre?: string
  analistaEmail: string
  engancheId?: string
  planHosting?: string
}

export interface ProvisionDesdeLeadResult {
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

function enganchePorRubro(rubro?: string | null): string {
  const map: Record<string, string> = {
    almacen: "pos.fiado_barrio",
    kiosco: "pool-kiosco-barrio",
    distribuidora: "pool-almacen-barrio",
    restaurante: "pool-servicios-barrio",
    industria: "pool-almacen-barrio",
    agro: "pool-almacen-barrio",
    ferreteria: "pos.balanza_peso",
    inmobiliaria: "pool-propiedad",
    consorcios: "pool-propiedad",
    administracion_consorcios: "pool-propiedad",
  }
  return map[rubro ?? ""] ?? "pos.fiado_barrio"
}

export async function provisionarDesdeLead(
  input: ProvisionDesdeLeadInput,
): Promise<ProvisionDesdeLeadResult> {
  const db = prisma as any
  const lead = await db.comercialPipelineLead.findUnique({ where: { id: input.leadId } })
  if (!lead) throw new Error("Lead no encontrado")
  if (lead.empresaId) {
    throw new Error(`Este lead ya tiene tenant #${lead.empresaId}`)
  }

  const negocio = (lead.negocio?.trim() || lead.nombre?.trim() || "Comercio Claver").slice(0, 120)
  const rubro = lead.rubro?.trim() || "almacen"
  const engancheId = input.engancheId || enganchePorRubro(rubro)
  const pack = resolvePackCalle(engancheId)
  if (pack && !pack.vendibleHoy) {
    throw new Error(`El pack "${engancheId}" todavía no está listo para provisionar`)
  }

  const modoLite = inferModoLiteFromEnganche(engancheId, undefined)
  const contactoNombre = input.contactoNombre?.trim() || lead.nombre?.trim() || negocio
  const contactoEmail = input.contactoEmail.trim().toLowerCase()
  const cuit = generarCuitDemo(negocio)
  const tempPassword = generarPasswordTemporal()
  const passwordHash = await hashPassword(tempPassword)

  const empresa = await db.empresa.create({
    data: {
      nombre: negocio,
      razonSocial: negocio,
      cuit,
      email: contactoEmail,
      telefono: lead.telefono,
      direccion: lead.localidad,
      planHosting: input.planHosting || "Trial Pipeline",
      entornoAfip: "homologacion",
      paisFiscal: "AR",
      rubro,
      modoLite,
      temaConfig: { locale: "es-AR" },
      activo: true,
    },
  })

  await setSignupOrigen(empresa.id, "provisioning", `lead:${input.leadId}`)
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
    planComercial: input.planHosting || "Trial Pipeline",
  })

  const onboarding = await applyRetailOnboarding({
    empresaId: empresa.id,
    rubro,
    engancheId,
    modoLite,
    origen: `lead:${input.leadId}`,
    trialDias: 14,
  })

  const updatedLead = await updateComercialLead(input.leadId, {
    etapa: "provisionado",
    empresaId: empresa.id,
    email: contactoEmail,
    proximaAccion: "Acompañar primer uso — día 1",
    notas: `Provisionado tenant #${empresa.id} · ${pack?.nombre ?? engancheId}`,
  })

  if (updatedLead) {
    void notifyAnalistasFunnel("lead_provisionado", updatedLead, { empresaId: empresa.id })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://claver.com.ar"
  const loginUrl = `${appUrl}/login`
  const destinoUrl = `${appUrl}${onboarding.landingPath}`

  const esPropiedad = engancheId === PACK_PROPIEDAD
  const cuerpoPropiedad = esPropiedad
    ? `<p>Ya podés liquidar expensas, avisar morosos por WhatsApp y gestionar contratos de alquiler.</p>
       <p><strong>Primer paso:</strong> entrá a Consorcios y seguí el checklist de bienvenida.</p>`
    : `<p>En minutos podés anotar el primer fiado o la primera venta.</p>`

  await emailService
    .enviar({
      to: contactoEmail,
      subject: esPropiedad
        ? `${negocio} — Claver Propiedad ya está listo`
        : `${negocio} — tu cuenta Claver ya está lista`,
      html: emailLayout(
        `
          <h2>${esPropiedad ? "Tu administración ya está en Claver" : "Tu negocio ya está en Claver"}</h2>
          <p>Hola <strong>${contactoNombre}</strong>, activamos <strong>${negocio}</strong> con <strong>${pack?.nombre ?? "Claver"}</strong>.</p>
          ${cuerpoPropiedad}
          <ul>
            <li><strong>Entrar:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
            <li><strong>Email:</strong> ${contactoEmail}</li>
            <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
            <li><strong>Ir directo a:</strong> <a href="${destinoUrl}">${pack?.nombre ?? "tu panel"}</a></li>
          </ul>
          <p>Trial 14 días. Cambiá la contraseña al ingresar.</p>
        `,
        { preheader: `${negocio} listo para operar` },
      ),
      text: `Claver listo. URL: ${loginUrl} · Email: ${contactoEmail} · Pass: ${tempPassword}`,
    })
    .catch((err) => console.warn("[provision-lead] Email cliente no enviado:", err))

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