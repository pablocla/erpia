import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const clienteId = parseInt(id, 10)
    
    if (isNaN(clienteId)) {
      return NextResponse.json({ error: "ID de cliente inválido" }, { status: 400 })
    }

    const visitas = await prisma.ordenServicio.findMany({
      where: {
        empresaId: auth.auth.empresaId,
        clienteId: clienteId,
        activo: true
      },
      orderBy: {
        fechaCreacion: 'desc'
      },
      take: 50 // Limitamos a las últimas 50 visitas para el historial
    })

    return NextResponse.json(visitas)
  } catch (error) {
    console.error("[GET /api/clientes/:id/fumigacion]", error)
    return NextResponse.json(
      { error: "Error al obtener el historial de visitas del cliente" },
      { status: 500 }
    )
  }
}
