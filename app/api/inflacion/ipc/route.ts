import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers } from "@/lib/auth/admin-roles"
import {
  listIndices,
  upsertIndicePeriodo,
  type IndiceCodigo,
} from "@/lib/inflacion"
import { z } from "zod"

/**
 * GET /api/inflacion/ipc?codigo=IPC_NACIONAL
 * Lista períodos de índice (público autenticado).
 *
 * POST /api/inflacion/ipc — upsert período (admin tenant o ops)
 * body: { codigo, periodo, valor, fuente? }
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const codigo = (req.nextUrl.searchParams.get("codigo") || "IPC_NACIONAL") as IndiceCodigo
  const rows = listIndices(codigo)
  return NextResponse.json({ success: true, codigo, indices: rows })
}

const postSchema = z.object({
  codigo: z.enum(["IPC_NACIONAL", "IPC_GBA", "UVA", "MANUAL"]),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  valor: z.number().positive(),
  fuente: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  if (!canManageUsers(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const row = {
    codigo: parsed.data.codigo as IndiceCodigo,
    periodo: parsed.data.periodo,
    valor: parsed.data.valor,
    fuente: parsed.data.fuente ?? "manual",
    publicadoAt: new Date().toISOString(),
  }
  upsertIndicePeriodo(row)
  return NextResponse.json({ success: true, indice: row })
}
