import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { runLegacyVsClaverBenchmark } from "@/lib/legacy-bridge/demo-benchmark"
import type { OpoCanonicalEntity } from "@/lib/opo/types"

const ENTITIES = new Set(["Customer", "Product", "Invoice", "Order", "Supplier"])

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const entity = (request.nextUrl.searchParams.get("entity") ?? "Customer") as OpoCanonicalEntity
  if (!ENTITIES.has(entity)) {
    return NextResponse.json({ error: `Entidad inválida: ${entity}` }, { status: 400 })
  }

  const benchmark = await runLegacyVsClaverBenchmark(auth.auth.empresaId, entity, {
    skipLegacyDelay: request.nextUrl.searchParams.get("fast") === "1",
  })

  return NextResponse.json(benchmark)
}