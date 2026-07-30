import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const sp = request.nextUrl.searchParams
    const tipo = sp.get("tipo") ?? undefined
    const estado = sp.get("estado") ?? undefined
    const depositoId = sp.get("depositoId") ? Number(sp.get("depositoId")) : undefined

    const tareas = await prisma.tareaWms.findMany({
      where: {
        empresaId: ctx.auth.empresaId,
        ...(tipo ? { tipo } : {}),
        ...(estado ? { estado } : {}),
        ...(depositoId ? { depositoId } : {}),
      },
      include: {
        producto: { select: { id: true, codigo: true, nombre: true } },
        fromUbicacion: { select: { id: true, codigo: true } },
        toUbicacion: { select: { id: true, codigo: true } },
        lote: { select: { id: true, numeroLote: true, fechaVencimiento: true } },
      },
      orderBy: [{ ordenPath: "asc" }, { createdAt: "desc" }],
      take: 200,
    })
    return NextResponse.json(tareas)
  } catch (error) {
    logError("api/wms/tareas:GET", error, request)
    return NextResponse.json({ error: "Error al listar tareas WMS" }, { status: 500 })
  }
}
