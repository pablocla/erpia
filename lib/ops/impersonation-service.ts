import { prisma } from "@/lib/prisma"
import { canAnalystAccessEmpresa } from "@/lib/auth/claver-analyst"
import { generarTokenImpersonacion } from "@/lib/auth/impersonation"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { validarLimiteActivacion } from "@/lib/ops/tenant-plan-service"

function db() {
  return prisma as any
}

export async function iniciarImpersonacionTenant(
  analyst: { userId: number; email: string },
  empresaId: number,
  targetPath?: string,
) {
  const allowed = await canAnalystAccessEmpresa(analyst.email, empresaId)
  if (!allowed) throw new Error("No tenés asignado este cliente")
  await validarLimiteActivacion(empresaId, { requiereImpersonacion: true })

  const empresa = await db().empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true, razonSocial: true },
  })
  if (!empresa) throw new Error("Empresa no encontrada")

  const token = await generarTokenImpersonacion({
    userId: analyst.userId,
    email: analyst.email,
    rol: "administrador",
    empresaId,
    impersonating: true,
    impersonatedBy: analyst.email,
    analystUserId: analyst.userId,
    analystEmail: analyst.email,
  })

  const redirectUrl = targetPath && targetPath.startsWith("/") ? targetPath : "/dashboard/configuracion"

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "ops",
    contexto: "impersonacion:analista",
    mensaje: `Analista ${analyst.email} abrió sesión impersonada en el ERP (${redirectUrl})`,
    metadata: { analystUserId: analyst.userId, targetPath: redirectUrl },
  })

  return {
    token,
    empresa,
    redirectUrl,
    expiresInSec: 7200,
  }
}