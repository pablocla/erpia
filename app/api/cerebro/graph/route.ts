import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getCompanyKnowledgeGraph } from "@/lib/cerebro/graph-projector"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const graphData = await getCompanyKnowledgeGraph(auth.auth.empresaId)
    return NextResponse.json({ ok: true, data: graphData })
  } catch (error: any) {
    console.error("[GET /api/cerebro/graph]", error)
    return NextResponse.json(
      { error: error?.message ?? "Error al proyectar el grafo de conocimiento" },
      { status: 500 },
    )
  }
}
