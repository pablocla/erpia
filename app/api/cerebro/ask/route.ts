import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { queryGraphRAG } from "@/lib/cerebro/graphrag-service"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const prompt = body.prompt?.trim() || "Resumen general del negocio"

    const result = await queryGraphRAG(auth.auth.empresaId, prompt)
    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    console.error("[POST /api/cerebro/ask]", error)
    return NextResponse.json(
      { error: error?.message ?? "Error al procesar la consulta GraphRAG" },
      { status: 500 },
    )
  }
}
