import { prisma } from "@/lib/prisma"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"
import { ensureProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { hashPassword } from "@/lib/auth/password"

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
    const empresa = await db.empresa.create({
      data: {
        nombre: orden.razonSocial,
        razonSocial: orden.razonSocial,
        cuit: orden.cuit,
        email: orden.contactoEmail,
        planHosting: orden.planHosting,
        entornoAfip: "homologacion",
        activo: true,
      },
    })

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

    // 5. Suscripciones (Opcional, en base a SKUs)
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
    const html = emailLayout(`
      <h2>¡Bienvenido a Claver Cloud ERP!</h2>
      <p>Hola ${orden.contactoNombre}, tu entorno para <strong>${orden.razonSocial}</strong> está listo.</p>
      <p>Podés acceder a la plataforma con las siguientes credenciales temporales:</p>
      <ul>
        <li><strong>URL:</strong> <a href="${appUrl}">${appUrl}</a></li>
        <li><strong>Email:</strong> ${orden.contactoEmail}</li>
        <li><strong>Contraseña:</strong> ${tempPassword}</li>
      </ul>
      <p>Por razones de seguridad, te recomendamos cambiar la contraseña al ingresar.</p>
    `, { preheader: "Bienvenido a Claver Cloud" })

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
