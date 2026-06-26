import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  analistaEmail: z.string().email(),
  empresaId: z.number(),
  rolAsignacion: z.enum(["lead", "soporte", "implementacion", "dba", "marketplace"]).default("soporte"),
  activo: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const data = await db.analistaAsignacion.findMany({
      include: {
        empresa: { select: { id: true, nombre: true, rubro: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error listar asignaciones:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = prisma as any
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const asignacion = await db.analistaAsignacion.upsert({
      where: {
        analistaEmail_empresaId: {
          analistaEmail: parsed.data.analistaEmail.toLowerCase(),
          empresaId: parsed.data.empresaId,
        },
      },
      create: {
        analistaEmail: parsed.data.analistaEmail.toLowerCase(),
        empresaId: parsed.data.empresaId,
        rolAsignacion: parsed.data.rolAsignacion,
        activo: parsed.data.activo ?? true,
      },
      update: {
        rolAsignacion: parsed.data.rolAsignacion,
        activo: parsed.data.activo ?? true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(asignacion, { status: 201 })
  } catch (error) {
    console.error("Error crear asignación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}