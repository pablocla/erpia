import { prisma } from "@/lib/prisma"

export async function persistSistemaLog(input: {
  empresaId?: number
  entornoId?: number
  severidad: string
  categoria: string
  contexto: string
  mensaje: string
  stack?: string
  requestId?: string
  metadata?: Record<string, unknown>
}) {
  const db = prisma as any
  try {
    return await db.sistemaLog.create({ data: input })
  } catch {
    return null
  }
}

export async function listSistemaLogs(empresaId: number, take = 50) {
  const db = prisma as any
  return db.sistemaLog.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    take,
  })
}