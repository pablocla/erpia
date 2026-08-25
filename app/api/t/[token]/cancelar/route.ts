import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarTokenTurno } from "@/lib/agenda/turno-jwt"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // 1. Verificar token
  const payload = await verificarTokenTurno(token)
  if (!payload) {
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 401 })
  }

  // 2. Buscar turno cruzando con empresaId
  const turno = await prisma.turno.findUnique({
    where: {
      id: payload.turnoId,
      empresaId: payload.empresaId,
    },
  })

  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  // 3. Validar estado actual
  if (turno.estado === "cancelado") {
    return NextResponse.json({ error: "El turno ya se encuentra cancelado." }, { status: 400 })
  }
  if (turno.estado === "completado") {
    return NextResponse.json({ error: "No se puede cancelar un turno ya completado." }, { status: 400 })
  }

  // 4. Actualizar estado a "cancelado"
  await prisma.turno.update({
    where: { id: turno.id },
    data: {
      estado: "cancelado",
      motivo: "Cancelado por el paciente/cliente vía web",
    },
  })

  return NextResponse.json({ success: true })
}
