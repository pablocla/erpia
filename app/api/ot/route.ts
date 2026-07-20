import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { OTService, type CreateOTInput } from "@/lib/ot/ot-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const clienteId = searchParams.get("clienteId")
  const estado = searchParams.get("estado")

  const filters = {
    ...(clienteId && { clienteId: parseInt(clienteId) }),
    ...(estado && { estado })
  }

  const ots = await new OTService().listarOrdenes(auth.auth.empresaId, filters)
  return NextResponse.json(ots)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    // Simplificación: en producción usar Zod para validar `CreateOTInput`
    const input = body as CreateOTInput

    const ot = await new OTService().crearOrden(auth.auth.empresaId, input)
    return NextResponse.json(ot, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/ot]", error)
    return NextResponse.json({ error: error.message || "Error al crear la OT" }, { status: 500 })
  }
}
