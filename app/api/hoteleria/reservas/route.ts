import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const reservas = await prisma.reservaHotel.findMany({
    where: whereEmpresa(auth.auth.empresaId),
    include: {
      cliente: {
        select: { id: true, nombre: true, email: true, telefono: true }
      },
      habitacion: {
        select: { id: true, numero: true, tipo: true }
      }
    },
    orderBy: { checkIn: 'desc' }
  })
  return NextResponse.json(reservas)
}
