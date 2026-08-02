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

    const historial = ots.map(ot => {
      const meta = parseMeta(ot.metadata)
      return {
        id: ot.id,
        numero: ot.numero,
        fecha: ot.fechaCreacion,
        estado: ot.estado,
        monto: meta.montoCobrado || 0,
        tecnico: ot.usuarioAsignado || "No asignado",
        observaciones: meta.observacionesVisita || "",
        plaga: meta.plaga || "—",
        vencimiento: meta.fechaVencimientoCertificado || null
      }
    })

    return NextResponse.json(historial)
  } catch (error) {
    console.error("[GET /api/clientes/[id]/historial]", error)
    return NextResponse.json({ error: "Error de red" }, { status: 500 })
  }
}
