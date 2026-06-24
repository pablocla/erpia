import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { buildDocsIndex } from "@/lib/docs/docs-index"

export async function GET(request: NextRequest) {
  // 1. Auth check
  const auth = await getAuthContext(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const index = buildDocsIndex()
    return NextResponse.json(index)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al construir el índice de documentación" },
      { status: 500 }
    )
  }
}
