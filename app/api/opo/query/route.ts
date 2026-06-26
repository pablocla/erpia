import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { executeOpoQuery } from "@/lib/opo/opo-query-service"

const querySchema = z.object({
  entity: z.enum(["Customer", "Product", "Invoice", "Order", "Supplier"]),
  limit: z.number().int().min(1).max(50).optional(),
  search: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = querySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Consulta inválida" }, { status: 400 })
  }

  try {
    const result = await executeOpoQuery(auth.auth.empresaId, parsed.data)
    return NextResponse.json(
      { status: "success", provider: "opo_studio", data: result },
      { headers: { "X-OPO-Version": "0.1.0" } },
    )
  } catch (err) {
    return NextResponse.json(
      { status: "error", code: "OPO-ERR-002", message: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    )
  }
}