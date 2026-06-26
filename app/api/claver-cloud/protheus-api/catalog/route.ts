import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  loadProtheusCatalog,
  refreshProtheusCatalogLive,
  searchProtheusCatalog,
} from "@/lib/opo/protheus-catalog-service"

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const sp = request.nextUrl.searchParams
  const q = sp.get("q") ?? undefined
  const moduleId = sp.get("module") ?? undefined
  const method = sp.get("method") ?? undefined
  const page = Number(sp.get("page") ?? "1")
  const pageSize = Number(sp.get("pageSize") ?? "50")
  const summaryOnly = sp.get("summary") === "1"

  if (summaryOnly) {
    const catalog = loadProtheusCatalog()
    return NextResponse.json({
      meta: catalog.meta,
      moduleCounts: catalog.moduleCounts,
      modules: catalog.modules,
    })
  }

  return NextResponse.json(
    searchProtheusCatalog({ q, moduleId, method, page, pageSize }),
  )
}

const refreshSchema = z.object({
  baseUrl: z.string().url(),
  user: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const parsed = refreshSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const bundle = await refreshProtheusCatalogLive(parsed.data)
    return NextResponse.json({
      ok: true,
      meta: bundle.meta,
      moduleCounts: bundle.moduleCounts,
      total: bundle.services.length,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Error al refrescar" },
      { status: 502 },
    )
  }
}