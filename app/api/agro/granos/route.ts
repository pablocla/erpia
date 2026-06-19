import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const granos = await prisma.agroGrano.findMany({
    where: { ...whereEmpresa(auth.auth.empresaId), activo: true },
    orderBy: { nombre: "asc" },
  })
  return NextResponse.json(granos)
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { codigo, nombre, unidad, iva } = body

  if (!codigo || !nombre) {
    return NextResponse.json({ error: "codigo y nombre son requeridos" }, { status: 400 })
  }

  const grano = await prisma.agroGrano.create({
    data: {
      empresaId: auth.auth.empresaId,
      codigo: String(codigo).toUpperCase(),
      nombre,
      unidad: unidad ?? "tn",
      iva: iva ?? 10.5,
    },
  })
  return NextResponse.json(grano, { status: 201 })
}
