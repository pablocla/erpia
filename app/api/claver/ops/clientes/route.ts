import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext, getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"
import { getResumenImplementacionFlota } from "@/lib/ops/implementacion-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const scope = await getAnalystEmpresaScope(ctx.auth.email)
    const where =
      scope.mode === "assigned" ? { id: { in: scope.empresaIds } } : {}

    const empresas = await db.empresa.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        razonSocial: true,
        cuit: true,
        rubro: true,
        entorno: true,
        entornoAfip: true,
        planHosting: true,
        _count: {
          select: {
            tickets: true,
            opsJobs: true,
            sistemaLogs: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    })

    const cards = await Promise.all(
      empresas.map(async (e: {
        id: number
        nombre: string
        razonSocial: string
        rubro: string
        entorno: string
        entornoAfip: string
        _count: { tickets: number; opsJobs: number; sistemaLogs: number }
      }) => {
        const entornos = await ensureTenantEntornos(e.id)
        const abiertos = await db.ticket.count({
          where: { empresaId: e.id, estado: { in: ["abierto", "en_progreso"] } },
        })
        const jobsActivos = await db.opsJob.count({
          where: { empresaId: e.id, estado: { in: ["pendiente", "en_progreso"] } },
        })
        const errores = await db.sistemaLog.count({
          where: { empresaId: e.id, severidad: { in: ["error", "fatal"] } },
        })
        const implementacion = await getResumenImplementacionFlota(e.id)

        return {
          ...e,
          entornos: entornos.map((en: { codigo: string; estado: string; version: string | null }) => ({
            codigo: en.codigo,
            estado: en.estado,
            version: en.version,
          })),
          metricas: {
            ticketsAbiertos: abiertos,
            jobsActivos,
            logsError: errores,
          },
          implementacion,
        }
      }),
    )

    return NextResponse.json({
      data: cards,
      scope: scope.mode,
      total: cards.length,
    })
  } catch (error) {
    console.error("Error listar clientes ops:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}