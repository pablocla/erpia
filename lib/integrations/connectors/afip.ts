import { prisma } from "@/lib/prisma"
import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok } from "./base"

export const afipConnector: IntegrationConnector = {
  id: "afip",

  async testConnection(ctx: ConnectionContext) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.empresaId },
      select: { cuit: true, certificadoCRT: true, certificadoKEY: true, entornoAfip: true },
    })
    if (!empresa) return fail("Empresa no encontrada")
    if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
      return fail("Subí el certificado y la clave AFIP en Configuración → Fiscal")
    }
    return ok(`AFIP listo — CUIT ${empresa.cuit} (${empresa.entornoAfip})`)
  },
}