import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const empresas = await db.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        razonSocial: true,
        rubro: true,
        _count: { select: { tickets: true } },
      },
      orderBy: { nombre: "asc" },
    })

    const data = empresas
      .filter((e: { _count: { tickets: number } }) => e._count.tickets > 0)
      .map((e: { id: number; nombre: string; razonSocial: string; rubro: string; _count: { tickets: number } }) => ({
        id: e.id,
        nombre: e.nombre,
        razonSocial: e.razonSocial,
        rubro: e.rubro,
        ticketsAbiertos: e._count.tickets,
      }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error al listar empresas CLAVER:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}