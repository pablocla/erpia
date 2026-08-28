import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarTokenTurno } from "@/lib/agenda/turno-jwt"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // 1. Verificar token
  const payload = await verificarTokenTurno(token)
  if (!payload) {
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 401 })
  }

  // 2. Buscar turno cruzando con empresaId por seguridad multi-tenant
  const turno = await prisma.turno.findUnique({
    where: {
      id: payload.turnoId,
      empresaId: payload.empresaId,
    },
    include: {
      empresa: {
        select: {
          nombre: true,
          telefono: true,
        },
      },
      profesional: {
        select: {
          nombre: true,
          especialidad: true,
        },
      },
      servicio: {
        select: {
          nombre: true,
        },
      },
      cliente: {
        select: {
          nombre: true,
        },
      },
    },
  })

  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  // 3. Devolver datos necesarios para la vista pública (omitiendo datos sensibles)
  return NextResponse.json({
    id: turno.id,
    fecha: turno.fecha,
    horaInicio: turno.horaInicio,
    estado: turno.estado,
    empresa: turno.empresa,
    profesional: turno.profesional,
    servicio: turno.servicio,
    cliente: turno.cliente,
  })
}
