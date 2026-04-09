import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const vehiculoSchema = z.object({
  patente: z.string().min(3),
  tipo: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  capacidadKg: z.number().positive().optional().nullable(),
  capacidadBultos: z.number().int().positive().optional().nullable(),
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
        { patente: { contains: search, mode: "insensitive" } },
        { tipo: { contains: search, mode: "insensitive" } },
        { marca: { contains: search, mode: "insensitive" } },
        { modelo: { contains: search, mode: "insensitive" } },
      ]
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where,
      orderBy: { patente: "asc" },
    })

    return NextResponse.json(vehiculos)
  } catch (error) {
    console.error("Error al listar vehiculos:", error)
    logError("api/distribucion/vehiculos:GET", error, request)
    return NextResponse.json({ error: "Error al listar vehiculos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = vehiculoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const vehiculo = await prisma.vehiculo.create({
      data: {
        empresaId: ctx.auth.empresaId,
        patente: parsed.data.patente.toUpperCase(),
        tipo: parsed.data.tipo ?? "utilitario",
        marca: parsed.data.marca ?? null,
        modelo: parsed.data.modelo ?? null,
        capacidadKg: parsed.data.capacidadKg ?? null,
        capacidadBultos: parsed.data.capacidadBultos ?? null,
        activo: parsed.data.activo ?? true,
      },
    })

    return NextResponse.json(vehiculo, { status: 201 })
  } catch (error) {
    console.error("Error al crear vehiculo:", error)
    logError("api/distribucion/vehiculos:POST", error, request)
    return NextResponse.json({ error: "Error al crear vehiculo" }, { status: 500 })
  }
}
