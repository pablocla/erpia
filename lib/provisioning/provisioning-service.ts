import { prisma } from "@/lib/prisma"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"
import { ensureProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { hashPassword } from "@/lib/auth/password"
import { applyRetailOnboarding } from "@/lib/comercial/retail-onboarding-service"
import {
  inferModoLiteFromEnganche,
  resolvePackCalle,
} from "@/lib/comercial/pack-calle-catalog"
import { setSignupOrigen } from "@/lib/ops/signup-tracking"

export async function procesarOrdenProvision(ordenId: number) {
  const db = prisma as any
  const orden = await db.ordenProvision.findUnique({
    where: { id: ordenId },
  })

  if (!orden) {
    throw new Error("Orden no encontrada")
  }

  if (orden.estado === "completado") {
    throw new Error("La orden ya fue procesada")
  }

  try {
    // 1. Crear Empresa
    const rubro = orden.rubro || "almacen"
    const engancheId = orden.engancheId || orden.engancheCandidato || "pos.fiado_barrio"
    const modoLite = orden.modoLite || inferModoLiteFromEnganche(engancheId)
    const pack = resolvePackCalle(engancheId)

    const empresa = await db.empresa.create({
      data: {
        nombre: orden.razonSocial,
        razonSocial: orden.razonSocial,
        cuit: orden.cuit || orden.rfc || "00000000000",
        email: orden.contactoEmail,
        planHosting: orden.planHosting,
        entornoAfip: "homologacion",
        paisFiscal: orden.paisFiscal || "AR",
        rubro,
        modoLite,
        temaConfig: { locale: orden.paisFiscal === "MX" ? "es-MX" : "es-AR" },
        activo: true,
      },
    })

    await setSignupOrigen(empresa.id, "provisioning", `orden:${ordenId}`)

    // 2. Crear Entornos (Dev, Val, Prd)
    await ensureTenantEntornos(empresa.id)

    // 3. Crear Usuario Admin Inicial
    const tempPassword = Math.random().toString(36).slice(-8)
    const passwordHash = await hashPassword(tempPassword)
    
    const usuario = await db.usuario.create({
      data: {
        empresaId: empresa.id,
        nombre: orden.contactoNombre,
        email: orden.contactoEmail.toLowerCase(),
        password: passwordHash,
        rol: "admin",
        activo: true,
      },
    })

    // 4. Crear Proyecto Implementación (CCA-010 -> CCA-020)
    await ensureProyectoImplementacion({
      empresaId: empresa.id,
      analistaEmail: orden.analistaAsignado || "sistema@claver.cloud",
      planComercial: orden.planHosting,
    })

    // 5. Onboarding retail + SKUs del enganche
    const onboarding = await applyRetailOnboarding({
      empresaId: empresa.id,
      rubro,
      engancheId,
      modoLite,
      origen: `orden_provision:${ordenId}`,
      trialDias: 14,
    })

    if (orden.skus && Array.isArray(orden.skus)) {
      for (const sku of orden.skus) {
        await db.suscripcionModulo.upsert({
          where: { empresaId_sku: { empresaId: empresa.id, sku } },
          create: { empresaId: empresa.id, sku, activo: true },
          update: { activo: true },
        })
      }
    }

    // 6. Marcar orden como completada
    await db.ordenProvision.update({
      where: { id: ordenId },
      data: { estado: "completado", empresaId: empresa.id },
    })

    // 7. Enviar email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://erp.claver.cloud"
    const destinoUrl = `${appUrl}${onboarding.landingPath}`
    const packNombre = pack?.nombre ?? "Libreta Fiado"
    const html = emailLayout(`
      <h2>Tu comercio ya está listo en Claver</h2>
      <p>Hola ${orden.contactoNombre}, configuramos <strong>${orden.razonSocial}</strong> con <strong>${packNombre}</strong>.</p>
      <p>En minutos podés anotar el primer fiado o la primera venta — sin cuaderno.</p>
      <ul>
        <li><strong>Entrar:</strong> <a href="${appUrl}/login">${appUrl}/login</a></li>
        <li><strong>Ir directo a:</strong> <a href="${destinoUrl}">${packNombre}</a></li>
        <li><strong>Email:</strong> ${orden.contactoEmail}</li>
        <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
      </ul>
      <p>Trial 14 días. Cambiá la contraseña al ingresar.</p>
    `, { preheader: `${orden.razonSocial} — listo para operar` })

    await emailService.enviar({
      to: orden.contactoEmail,
      subject: "¡Bienvenido a Claver Cloud! Tu entorno está listo",
      html,
      text: `Bienvenido. URL: ${appUrl} - Email: ${orden.contactoEmail} - Pass: ${tempPassword}`,
    })

    return { success: true, empresaId: empresa.id }
  } catch (error: any) {
    await db.ordenProvision.update({
      where: { id: ordenId },
      data: { estado: "error" },
    })
    console.error("Error aprovisionando tenant:", error)
    throw error
  }
}
