import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { PRW_FILES } from "@/lib/protheus-invest/rest-config"
import { forwardToProtheus } from "@/lib/protheus-invest/forward"
import { readPrwSource } from "@/lib/legacy-bridge/prw-service"

const PRW_ROOT = "data/protheus/advpl/edge/investments"

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file")
  if (!file) {
    return NextResponse.json({
      sku: "edge.investments",
      archivos: PRW_FILES,
      downloadHint: "GET /api/public/protheus-invest?file=CLVINV01.PRW",
    })
  }
  const allowed = PRW_FILES.some((f) => f.file === file)
  if (!allowed || file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Archivo no permitido" }, { status: 400 })
  }
  try {
    const content = readPrwSource(`${PRW_ROOT}/${file}`)
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo leer el PRW" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const blocked = checkRateLimit(request, "protheus-invest-proxy", 30, 60 * 1000)
  if (blocked) return blocked

  let payload: {
    baseUrl?: string
    user?: string
    password?: string
    method?: string
    path?: string
    body?: unknown
  }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, status: 400, ms: 0, error: "JSON inválido" }, { status: 400 })
  }

  const result = await forwardToProtheus({
    baseUrl: payload.baseUrl ?? "",
    user: payload.user ?? "",
    password: payload.password ?? "",
    method: payload.method ?? "GET",
    path: payload.path ?? "",
    body: payload.body,
  })
  return NextResponse.json(result, { status: result.status === 400 || result.status === 405 ? result.status : 200 })
}
