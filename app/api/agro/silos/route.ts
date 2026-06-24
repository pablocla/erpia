import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const silos = await prisma.agroSilo.findMany({
    where: { ...whereEmpresa(auth.auth.empresaId), activo: true },
    include: { grano: true },
    orderBy: { nombre: "asc" },
  })
  return NextResponse.json(silos)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { nombre, capacidadTn, granoId, lat, lon } = body

  if (!nombre || !capacidadTn) {
    return NextResponse.json({ error: "nombre y capacidadTn son requeridos" }, { status: 400 })
  }

  const silo = await prisma.agroSilo.create({
    data: {
      empresaId: auth.auth.empresaId,
      nombre,
      capacidadTn: Number(capacidadTn),
      granoId: granoId ? Number(granoId) : null,
      stockActualTn: 0,
    },
  })
  return NextResponse.json(silo, { status: 201 })
}

