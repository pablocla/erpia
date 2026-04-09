import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const crearPlanSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  precio: z.number().positive(),
  periodicidad: z.enum(["mensual", "trimestral", "semestral", "anual"]),
  duracionDias: z.number().int().positive(),
})

const crearMembresiaSchema = z.object({
  planId: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  fechaInicio: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const [planes, membresias] = await Promise.all([
      prisma.planMembresia.findMany({
        where: { empresaId: usuario.empresaId },
        include: { _count: { select: { membresias: true } } },
        orderBy: { nombre: "asc" },
      }),
      prisma.membresia.findMany({
        where: { plan: { empresaId: usuario.empresaId } },
        include: {
          plan: { select: { id: true, nombre: true, precio: true, periodicidad: true } },
          cliente: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { fechaInicio: "desc" },
      }),
    ])

    const activas = membresias.filter(m => m.estado === "activa").length
    const vencidas = membresias.filter(m => m.estado === "vencida").length
    const ingresoMensual = membresias
      .filter(m => m.estado === "activa")
      .reduce((sum, m) => sum + Number(m.plan.precio), 0)

    const resumen = { totalPlanes: planes.length, totalMembresias: membresias.length, activas, vencidas, ingresoMensual }

    return NextResponse.json({ success: true, planes, membresias, resumen })
  } catch (error) {
    console.error("Error al obtener membresías:", error)
    return NextResponse.json({ error: "Error al obtener membresías" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()

    // Creating a plan
    if (body.tipo === "plan") {
      const data = crearPlanSchema.parse(body)
      const plan = await prisma.planMembresia.create({
        data: { ...data, precio: data.precio, empresaId: usuario.empresaId },
      })
      return NextResponse.json({ success: true, plan }, { status: 201 })
    }

    // Creating a membership
    const data = crearMembresiaSchema.parse(body)
    const plan = await prisma.planMembresia.findUnique({ where: { id: data.planId } })
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

    const fechaInicio = new Date(data.fechaInicio)
    const fechaFin = new Date(fechaInicio)
    fechaFin.setDate(fechaFin.getDate() + plan.duracionDias)

    const membresia = await prisma.membresia.create({
      data: {
        planId: data.planId,
        clienteId: data.clienteId,
        fechaInicio,
        fechaFin,
      },
      include: {
        plan: { select: { nombre: true, precio: true } },
        cliente: { select: { nombre: true } },
      },
    })

    return NextResponse.json({ success: true, membresia }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    console.error("Error al crear:", error)
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}
