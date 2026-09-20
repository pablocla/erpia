import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { PROTHEUS_SX_TABLES, PROTHEUS_INTROSPECTION_ENDPOINTS } from "@/lib/opo/protheus-sx-meta"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const searchParams = request.nextUrl.searchParams
  const tableId = searchParams.get("table")?.toUpperCase()

  if (tableId) {
    const tableMeta = PROTHEUS_SX_TABLES.find(t => t.id === tableId)
    if (!tableMeta) {
      return NextResponse.json({
        ok: false,
        error: `Tabla de diccionario ${tableId} no encontrada en la especificación SX.`
      }, { status: 404 })
    }
    return NextResponse.json({
      ok: true,
      data: tableMeta
    })
  }

  return NextResponse.json({
    ok: true,
    data: {
      tables: PROTHEUS_SX_TABLES,
      introspectionEndpoints: PROTHEUS_INTROSPECTION_ENDPOINTS,
      totalCount: PROTHEUS_SX_TABLES.length
    }
  })
}
