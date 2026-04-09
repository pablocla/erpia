import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const empresa = await prisma.empresa.findUnique({
    where: { id: ctx.auth.empresaId },
    select: {
      id: true,
      nombre: true,
      razonSocial: true,
      rubro: true,
      condicionIva: true,
    },
  })

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  return NextResponse.json({
    empresaId: empresa.id,
    nombre: empresa.nombre,
    razonSocial: empresa.razonSocial,
    rubro: empresa.rubro,
    condicionIva: empresa.condicionIva,
  })
}
