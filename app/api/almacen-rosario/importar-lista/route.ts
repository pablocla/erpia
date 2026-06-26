import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import {
  parsearListaDistribuidora,
  generarPropuestasLista,
  aplicarPropuestasLista,
} from "@/lib/almacen-rosario/lista-distribuidora-service"

const previewSchema = z.object({
  accion: z.literal("preview"),
  contenido: z.string().min(10),
})

const aplicarSchema = z.object({
  accion: z.literal("aplicar"),
  propuestas: z.array(
    z.object({
      productoId: z.number().int().positive(),
      precioCompraNuevo: z.number().nonnegative(),
      precioVentaSugerido: z.number().nonnegative(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const acceso = await canUseSku(ctx.auth.empresaId, "pos.lista_distribuidora")
  if (!acceso.ok) {
    return NextResponse.json({ error: "Activá pos.lista_distribuidora" }, { status: 403 })
  }

  const body = await request.json()

  const preview = previewSchema.safeParse(body)
  if (preview.success) {
    const filas = parsearListaDistribuidora(preview.data.contenido)
    const resultado = await generarPropuestasLista(ctx.auth.empresaId, filas)
    return NextResponse.json(resultado)
  }

  const aplicar = aplicarSchema.safeParse(body)
  if (aplicar.success) {
    const r = await aplicarPropuestasLista(ctx.auth.empresaId, aplicar.data.propuestas)
    return NextResponse.json(r)
  }

  return NextResponse.json({ error: "accion inválida (preview|aplicar)" }, { status: 400 })
}