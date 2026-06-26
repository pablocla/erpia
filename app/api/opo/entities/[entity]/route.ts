import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { executeOpoQuery } from "@/lib/opo/opo-query-service"
import type { OpoCanonicalEntity } from "@/lib/opo/types"

const ENTITIES = new Set(["Customer", "Product", "Invoice", "Order", "Supplier"])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { entity } = await params
  if (!ENTITIES.has(entity)) {
    return NextResponse.json(
      { status: "error", code: "OPO-ERR-002", message: `Entidad no configurada: ${entity}` },
      { status: 404 },
    )
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "10")
  const search = request.nextUrl.searchParams.get("search") ?? undefined

  try {
    const result = await executeOpoQuery(auth.auth.empresaId, {
      entity: entity as OpoCanonicalEntity,
      limit: Number.isFinite(limit) ? limit : 10,
      search,
    })
    return NextResponse.json(result, { headers: { "X-OPO-Version": "0.1.0" } })
  } catch (err) {
    return NextResponse.json(
      { status: "error", code: "OPO-ERR-001", message: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    )
  }
}