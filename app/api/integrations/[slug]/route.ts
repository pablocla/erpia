import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isAdminRole } from "@/lib/auth/admin-roles"
import {
  obtenerDetalleConexion,
  guardarSyncConfig,
  probarConexion,
} from "@/lib/integrations/connection-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { slug } = await params
  try {
    const detalle = await obtenerDetalleConexion(ctx.auth.empresaId, slug)
    return NextResponse.json({ success: true, ...detalle })
  } catch {
    return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 })
  }
}

const PatchSchema = z.object({
  configSync: z.object({
    entidades: z.record(z.object({
      activo: z.boolean(),
      direccion: z.string(),
      frecuencia: z.string(),
    })),
  }).optional(),
  accion: z.enum(["probar", "sync_config", "sincronizar"]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
  }

  const { slug } = await params
  const body = await request.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  if (parsed.data.accion === "probar") {
    const test = await probarConexion(ctx.auth.empresaId, slug)
    return NextResponse.json({ success: true, test })
  }

  if (parsed.data.accion === "sincronizar") {
    const { ejecutarSincronizacion } = await import("@/lib/integrations/sync-runner")
    const sync = await ejecutarSincronizacion(ctx.auth.empresaId, slug, parsed.data.configSync)
    const detalle = await obtenerDetalleConexion(ctx.auth.empresaId, slug)
    return NextResponse.json({ success: true, sync, ...detalle })
  }

  if (parsed.data.configSync) {
    await guardarSyncConfig(ctx.auth.empresaId, slug, parsed.data.configSync)
  }

  const detalle = await obtenerDetalleConexion(ctx.auth.empresaId, slug)
  return NextResponse.json({ success: true, ...detalle })
}