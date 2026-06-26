import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import {
  emitirVale,
  listarValesActivos,
  generarTextoTicketVale,
} from "@/lib/almacen-rosario/vale-dinero-service"

const emitirSchema = z.object({
  monto: z.number().positive(),
  titularNombre: z.string().max(120).optional(),
  clienteId: z.number().int().positive().optional(),
  observaciones: z.string().max(500).optional(),
  diasVencimiento: z.number().int().min(1).max(365).optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const acceso = await canUseSku(ctx.auth.empresaId, "pos.vale_dinero")
  if (!acceso.ok) {
    return NextResponse.json({ error: "Vale de dinero no activo" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limite = Math.min(Number(searchParams.get("limite") ?? "50"), 200)
  const vales = await listarValesActivos(ctx.auth.empresaId, limite)
  return NextResponse.json(vales)
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const acceso = await canUseSku(ctx.auth.empresaId, "pos.vale_dinero")
    if (!acceso.ok) {
      return NextResponse.json({ error: "Vale de dinero no activo" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = emitirSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const vale = await emitirVale({ empresaId: ctx.auth.empresaId, ...parsed.data })
    const ticket = generarTextoTicketVale({
      numero: vale.numero,
      montoOriginal: vale.montoOriginal,
      titularNombre: parsed.data.titularNombre,
      fechaEmision: new Date().toISOString().slice(0, 10),
      fechaVencimiento: parsed.data.diasVencimiento
        ? new Date(Date.now() + parsed.data.diasVencimiento * 86400000).toISOString().slice(0, 10)
        : null,
      observaciones: parsed.data.observaciones,
    })

    return NextResponse.json({ ...vale, ticket }, { status: 201 })
  } catch (error) {
    console.error("Error al emitir vale:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}