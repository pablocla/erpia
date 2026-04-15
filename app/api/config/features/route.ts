import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import {
  getAllFeatures,
  setFeature,
  isFeatureActiva,
  getFeatureConfig,
} from "@/lib/config/rubro-config-service"
import { z } from "zod"

// GET — Listar todas las features de la empresa (con merge rubro/empresa)
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(req.url)
  const featureKey = searchParams.get("feature")

  // Si piden una feature específica
  if (featureKey) {
    const config = await getFeatureConfig(ctx.auth.empresaId, featureKey)
    const activa = config.activado
    return NextResponse.json({ featureKey, ...config, activa })
  }

  const features = await getAllFeatures(ctx.auth.empresaId)
  return NextResponse.json(features)
}

const patchSchema = z.object({
  featureKey: z.string().min(1),
  activado: z.boolean().optional(),
  modoSimplificado: z.boolean().optional(),
  parametros: z.record(z.unknown()).optional(),
})

// PATCH — Activar/desactivar/configurar una feature para la empresa
export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { featureKey, ...data } = parsed.data
  await setFeature(ctx.auth.empresaId, featureKey, data)

  return NextResponse.json({ ok: true, featureKey })
}
