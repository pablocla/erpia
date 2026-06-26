import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  activarProducto,
  desactivarProducto,
  activarPack,
  desactivarPack,
  obtenerEstadoProductos,
} from "@/lib/platform/product-lifecycle"
const ADMIN_ROLES = ["admin", "propietario", "administrador", "dueno"]

const patchSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("sku"), sku: z.string(), activo: z.boolean() }),
  z.object({ tipo: z.literal("pack"), packId: z.string(), activo: z.boolean() }),
])

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const resumen = await obtenerEstadoProductos(ctx.auth.empresaId)
  return NextResponse.json(resumen)
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!ADMIN_ROLES.includes(ctx.auth.rol)) {
    return NextResponse.json({ error: "Sin permisos para gestionar productos" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const empresaId = ctx.auth.empresaId

  try {
    if (parsed.data.tipo === "pack") {
      const result = parsed.data.activo
        ? await activarPack(empresaId, parsed.data.packId, "admin_toggle")
        : await desactivarPack(empresaId, parsed.data.packId, "admin_toggle")
      const resumen = await obtenerEstadoProductos(empresaId)
      return NextResponse.json({ result, ...resumen })
    }

    const result = parsed.data.activo
      ? await activarProducto(empresaId, parsed.data.sku, "admin_toggle")
      : await desactivarProducto(empresaId, parsed.data.sku, "admin_toggle")

    const resumen = await obtenerEstadoProductos(empresaId)
    return NextResponse.json({ result, ...resumen })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al cambiar producto" },
      { status: 400 },
    )
  }
}