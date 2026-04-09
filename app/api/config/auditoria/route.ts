import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

// ─── GET — Lista log de actividad con filtros ────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const modulo = searchParams.get("modulo")
    const accion = searchParams.get("accion")
    const usuarioId = searchParams.get("usuarioId")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const where: Record<string, unknown> = {}
    if (modulo) where.modulo = modulo
    if (accion) where.accion = accion
    if (usuarioId) where.usuarioId = parseInt(usuarioId, 10)
    if (desde || hasta) {
      where.createdAt = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
      }
    }

    const [data, total] = await Promise.all([
      prisma.logActividad.findMany({
        where,
        include: {
          usuario: { select: { id: true, nombre: true, email: true, rol: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.logActividad.count({ where }),
    ])

    // Aggregate stats
    const modulosAgg = await prisma.logActividad.groupBy({
      by: ["modulo"],
      _count: true,
      orderBy: { _count: { modulo: "desc" } },
      take: 10,
    })

    const accionesAgg = await prisma.logActividad.groupBy({
      by: ["accion"],
      _count: true,
      orderBy: { _count: { accion: "desc" } },
      take: 10,
    })

    return NextResponse.json({
      data,
      total,
      skip,
      take,
      resumen: {
        totalLogs: total,
        porModulo: modulosAgg.map((m: any) => ({ modulo: m.modulo, count: m._count })),
        porAccion: accionesAgg.map((a: any) => ({ accion: a.accion, count: a._count })),
      },
    })
  } catch (error) {
    console.error("Error en GET logs:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
