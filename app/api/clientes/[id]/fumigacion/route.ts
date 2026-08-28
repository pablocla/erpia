import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { parseMeta } from "@/lib/ot-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  
  const id = Number((await params).id)
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  try {
    const ots = await prisma.ordenServicio.findMany({
      where: {
        clienteId: id,
        empresaId: auth.auth.empresaId,
      },
      orderBy: {
        fechaCreacion: "desc",
      }
    })

    const visitas = ots.map(ot => {
      const meta = parseMeta(ot.metadata)
      return {
        id: ot.id,
        numero: ot.numero,
        estado: ot.estado,
        titulo: ot.titulo,
        fechaCreacion: ot.fechaCreacion.toISOString(),
        fechaPrometida: ot.fechaPrometida ? ot.fechaPrometida.toISOString() : null,
        tecnicoAsignado: (ot as any).usuarioAsignado,
        metadata: meta
      }
    })

    return NextResponse.json(visitas)
  } catch (error) {
    console.error("[GET /api/clientes/[id]/fumigacion]", error)
    return NextResponse.json({ error: "Error de red" }, { status: 500 })
  }
}
