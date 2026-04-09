import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const lista = await prisma.listaPicking.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      include: {
        lineas: { include: { producto: { select: { id: true, nombre: true, codigo: true } } } },
        remito: { select: { id: true, numero: true } },
      },
    })

    if (!lista) return NextResponse.json({ error: "Lista de picking no encontrada" }, { status: 404 })
    return NextResponse.json(lista)
  } catch (error) {
    console.error("Error al obtener lista de picking:", error)
    logError("api/picking/[id]:GET", error, request)
    return NextResponse.json({ error: "Error al obtener lista de picking" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const { estado, operario, lineas } = body

    const listaExistente = await prisma.listaPicking.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!listaExistente) return NextResponse.json({ error: "Lista de picking no encontrada" }, { status: 404 })

    // Update picking list state
    if (lineas && Array.isArray(lineas)) {
      // Bulk update line quantities
      await Promise.all(
        lineas.map((l: { id: number; cantidadPicada: number }) =>
          prisma.lineaPicking.update({
            where: { id: l.id },
            data: {
              cantidadPicada: l.cantidadPicada,
              estado: l.cantidadPicada === 0 ? "pendiente" : undefined,
            },
          })
        )
      )
    }

    const lista = await prisma.listaPicking.update({
      where: { id },
      data: {
        ...(estado && { estado }),
        ...(operario !== undefined && { operario }),
      },
      include: {
        lineas: { include: { producto: { select: { id: true, nombre: true, codigo: true } } } },
        remito: { select: { id: true, numero: true } },
      },
    })

    return NextResponse.json(lista)
  } catch (error) {
    console.error("Error al actualizar lista de picking:", error)
    logError("api/picking/[id]:PATCH", error, request)
    return NextResponse.json({ error: "Error al actualizar lista de picking" }, { status: 500 })
  }
}
