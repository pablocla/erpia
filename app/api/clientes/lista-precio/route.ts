import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  listaPrecioId: z.number().int().positive().nullable(),
  clienteIds: z.array(z.number().int().positive()).min(1),
})

export async function PATCH(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const { listaPrecioId, clienteIds } = parsed.data

    const result = await prisma.cliente.updateMany({
      where: { id: { in: clienteIds } },
      data: { listaPrecioId },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error("Error al asignar lista de precio a clientes:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
