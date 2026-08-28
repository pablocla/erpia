import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { generarTokenTurno } from "@/lib/agenda/turno-jwt"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const turnoId = parseInt(id, 10)

  if (isNaN(turnoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  // Verificar que el turno pertenece a la empresa
  const turno = await prisma.turno.findUnique({
    where: {
      id: turnoId,
      empresaId: auth.auth.empresaId,
    },
  })

  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  // Generar JWT
  const token = await generarTokenTurno(turno.id, auth.auth.empresaId)
  
  // Construir URL pública (usando el host actual)
  const host = request.headers.get("host") || "claver.com.ar"
  const protocol = host.includes("localhost") ? "http" : "https"
  const url = `${protocol}://${host}/t/${token}`

  return NextResponse.json({ url, token })
}
