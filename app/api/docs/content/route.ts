import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { loadMdx } from "@/lib/docs/load-mdx"

export async function GET(request: NextRequest) {
  // 1. Auth check
  const auth = await getAuthContext(request)
  if (!auth.ok) {
    return auth.response
  }

  // 2. Extract and validate parameters
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")

  if (!slug) {
    return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 })
  }

  try {
    const doc = await loadMdx(slug)
    if (!doc) {
      return NextResponse.json({ error: "Documentación no encontrada" }, { status: 404 })
    }

    return NextResponse.json(doc)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cargar la documentación" },
      { status: 400 }
    )
  }
}
