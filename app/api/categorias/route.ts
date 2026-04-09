import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const categorias = await prisma.categoria.findMany({
      where: whereEmpresa(ctx.auth.empresaId),
      include: { _count: { select: { productos: true } } },
      orderBy: { nombre: "asc" },
    })
    return NextResponse.json(categorias)
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { nombre, descripcion } = await request.json()
    if (!nombre) return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 })

    const categoria = await prisma.categoria.create({
      data: { nombre, descripcion, empresaId: ctx.auth.empresaId },
    })
    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    console.error("Error al crear categoría:", error)
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 })
  }
}
