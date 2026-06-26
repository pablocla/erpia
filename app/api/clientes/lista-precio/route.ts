import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  listaPrecioId: z.number().int().positive().nullable(),
  clienteIds: z.array(z.number().int().positive()).min(1),
})

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const { listaPrecioId, clienteIds } = parsed.data
    const { empresaId } = auth.auth

    if (listaPrecioId != null) {
      const lista = await prisma.listaPrecio.findFirst({
        where: { id: listaPrecioId, empresaId },
      })
      if (!lista) {
        return NextResponse.json({ error: "Lista de precio no encontrada" }, { status: 404 })
      }
    }

    const result = await prisma.cliente.updateMany({
      where: { id: { in: clienteIds }, empresaId },
      data: { listaPrecioId },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error("Error al asignar lista de precio a clientes:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
