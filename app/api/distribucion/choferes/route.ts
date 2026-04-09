import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const choferSchema = z.object({
  nombre: z.string().min(1),
  documento: z.string().optional(),
  licencia: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  activo: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const activo = searchParams.get("activo")

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (activo === "true") where.activo = true
    if (activo === "false") where.activo = false
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { documento: { contains: search, mode: "insensitive" } },
        { licencia: { contains: search, mode: "insensitive" } },
      ]
    }

    const choferes = await prisma.chofer.findMany({
      where,
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(choferes)
  } catch (error) {
    console.error("Error al listar choferes:", error)
    logError("api/distribucion/choferes:GET", error, request)
    return NextResponse.json({ error: "Error al listar choferes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = choferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const chofer = await prisma.chofer.create({
      data: {
        empresaId: ctx.auth.empresaId,
        nombre: parsed.data.nombre,
        documento: parsed.data.documento || null,
        licencia: parsed.data.licencia || null,
        telefono: parsed.data.telefono || null,
        email: parsed.data.email || null,
        activo: parsed.data.activo ?? true,
      },
    })

    return NextResponse.json(chofer, { status: 201 })
  } catch (error) {
    console.error("Error al crear chofer:", error)
    logError("api/distribucion/choferes:POST", error, request)
    return NextResponse.json({ error: "Error al crear chofer" }, { status: 500 })
  }
}
