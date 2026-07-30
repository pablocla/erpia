import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const cerraduras = await prisma.cerraduraIoT.findMany({
    where: whereEmpresa(auth.auth.empresaId),
    include: {
      habitacion: {
        select: { id: true, numero: true, tipo: true }
      }
    },
    orderBy: { habitacion: { numero: 'asc' } }
  })
  
  return NextResponse.json(cerraduras)
}
