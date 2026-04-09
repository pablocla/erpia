import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cobrosService } from "@/lib/cobros/cobros-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const data = await cobrosService.listarRecibos({
      empresaId: ctx.auth.empresaId,
      clienteId: clienteId ? parseInt(clienteId, 10) : undefined,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      skip,
      take,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al listar recibos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
