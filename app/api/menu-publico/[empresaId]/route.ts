import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const { empresaId: empresaIdRaw } = await params
  const empresaId = Number(empresaIdRaw)

  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    return NextResponse.json({ error: "Empresa inválida" }, { status: 400 })
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true, telefono: true },
  })

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  const productos = await prisma.producto.findMany({
    where: { empresaId, esPlato: true, activo: true },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      precioVenta: true,
      categoria: { select: { id: true, nombre: true } },
    },
    orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
  })

  const categorias = Array.from(
    new Map(
      productos
        .filter((p) => p.categoria)
        .map((p) => [p.categoria!.id, { id: p.categoria!.id, nombre: p.categoria!.nombre }]),
    ).values(),
  )

  const platosSinCategoria = productos.filter((p) => !p.categoria)

  return NextResponse.json({
    success: true,
    empresa,
    categorias,
    platos: productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precioVenta: Number(p.precioVenta),
      categoriaId: p.categoria?.id ?? null,
      categoriaNombre: p.categoria?.nombre ?? null,
    })),
    platosSinCategoria: platosSinCategoria.map((p) => p.id),
  })
}