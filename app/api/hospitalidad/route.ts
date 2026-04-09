import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"

const crearComandaSchema = z.object({
  mesaId: z.number().int().positive(),
  comensales: z.number().int().positive().default(1),
  mozo: z.string().optional(),
  lineas: z.array(z.object({
    productoId: z.number().int().optional(),
    nombre: z.string().min(1).optional(),
    cantidad: z.number().int().positive(),
    precio: z.number().positive().optional(),
    notas: z.string().optional(),
  })).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const params = request.nextUrl.searchParams
    const salonId = params.get("salonId")

    const whereSalon: Record<string, unknown> = { salon: { empresaId: ctx.auth.empresaId } }
    if (salonId) whereSalon.salonId = Number(salonId)

    const [mesas, salones, comandasAbiertas] = await Promise.all([
      prisma.mesa.findMany({
        where: whereSalon,
        include: {
          salon: { select: { id: true, nombre: true } },
          comandas: {
            where: { estado: { notIn: ["cerrada", "cancelada"] } },
            include: { lineas: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { numero: "asc" },
      }),
      prisma.salon.findMany({
        where: { empresaId: ctx.auth.empresaId },
        include: { _count: { select: { mesas: true } } },
        orderBy: { nombre: "asc" },
      }),
      prisma.comanda.findMany({
        where: { estado: { notIn: ["cerrada", "cancelada"] }, mesa: { salon: { empresaId: ctx.auth.empresaId } } },
        include: {
          mesa: { select: { id: true, numero: true } },
          lineas: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    const resumen = {
      totalMesas: mesas.length,
      ocupadas: mesas.filter(m => m.estado === "ocupada").length,
      libres: mesas.filter(m => m.estado === "libre").length,
      comandasAbiertas: comandasAbiertas.length,
    }

    return NextResponse.json({ success: true, mesas, salones, comandasAbiertas, resumen })
  } catch (error) {
    console.error("Error al obtener hospitalidad:", error)
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const data = crearComandaSchema.parse(body)

    const productoIds = data.lineas
      .map((l) => l.productoId)
      .filter((id): id is number => Boolean(id))

    const productos = productoIds.length
      ? await prisma.producto.findMany({
          where: { id: { in: productoIds }, empresaId: ctx.auth.empresaId },
        })
      : []

    const productosMap = new Map(productos.map((p) => [p.id, p]))
    if (productoIds.length && productos.length !== productoIds.length) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const comanda = await prisma.$transaction(async (tx) => {
      const cmd = await tx.comanda.create({
        data: {
          mesaId: data.mesaId,
          comensales: data.comensales,
          mozo: data.mozo,
          lineas: {
            create: data.lineas.map((l) => {
              const producto = l.productoId ? productosMap.get(l.productoId) : null
              const nombre = l.nombre ?? producto?.nombre
              const precio = l.precio ?? producto?.precioVenta
              if (!nombre || precio === undefined) {
                throw new Error("Linea de comanda inválida")
              }
              return {
                nombre,
                cantidad: l.cantidad,
                precio,
                notas: l.notas,
                productoId: l.productoId,
              }
            }),
          },
        },
        include: { lineas: true, mesa: { select: { numero: true } } },
      })

      // Mark table as occupied
      await tx.mesa.update({ where: { id: data.mesaId }, data: { estado: "ocupada" } })

      return cmd
    })

    return NextResponse.json({ success: true, comanda }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    console.error("Error al crear comanda:", error)
    return NextResponse.json({ error: "Error al crear comanda" }, { status: 500 })
  }
}
