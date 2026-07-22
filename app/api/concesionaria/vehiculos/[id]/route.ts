import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  const id = Number((await params).id)
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  try {
    const data = await request.json()
    const actualizado = await prisma.vehiculoConcesionaria.update({
      where: {
        id,
        empresaId: auth.auth.empresaId, // Ensure it belongs to the enterprise
      },
      data: {
        patente: data.patente?.toUpperCase().trim(),
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio ? Number(data.anio) : undefined,
        kilometros: data.kilometros ? Number(data.kilometros) : undefined,
        estado: data.estado,
        precioToma: data.precioToma ? Number(data.precioToma) : undefined,
        precioVenta: data.precioVenta ? Number(data.precioVenta) : undefined,
        consignacion: data.consignacion !== undefined ? Boolean(data.consignacion) : undefined,
        observaciones: data.observaciones,
      },
    })
    return NextResponse.json(actualizado)
  } catch (err: any) {
    if (err.code === "P2025") return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  const id = Number((await params).id)
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  try {
    await prisma.vehiculoConcesionaria.delete({
      where: {
        id,
        empresaId: auth.auth.empresaId,
      },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.code === "P2025") return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
