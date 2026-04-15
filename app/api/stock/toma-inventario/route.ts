import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { tomaInventarioService } from "@/lib/stock/toma-inventario-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const tomas = await tomaInventarioService.listar(auth.auth.empresaId)
    return NextResponse.json({ success: true, tomas })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { accion } = body

    if (accion === "crear") {
      const result = await tomaInventarioService.crear(body.depositoId, auth.auth.empresaId)
      return NextResponse.json({ success: true, ...result }, { status: 201 })
    }

    if (accion === "cargar_conteo") {
      await tomaInventarioService.cargarConteo(body.tomaId, body.conteos)
      return NextResponse.json({ success: true })
    }

    if (accion === "procesar") {
      const result = await tomaInventarioService.procesar(body.tomaId)
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error" }, { status: 500 })
  }
}
