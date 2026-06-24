import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  getCaeaConfig,
  getCaeaVigencia,
  saveCaeaConfig,
  CAEA_MODO_LABELS,
  type CaeaModoEmision,
} from "@/lib/afip/caea-config"
import { invalidateConfigCache } from "@/lib/config/parametro-service"

const putSchema = z.object({
  habilitado: z.boolean().optional(),
  modoEmision: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  autoInformar: z.boolean().optional(),
  autoSolicitar: z.boolean().optional(),
})

/**
 * GET  /api/config/caea — Parametrización + vigencia CAEA
 * PUT  /api/config/caea — Guardar parametrización CAEA
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const empresaId = auth.auth.empresaId
  const [config, vigencia] = await Promise.all([
    getCaeaConfig(empresaId),
    getCaeaVigencia(empresaId),
  ])

  return NextResponse.json({
    config,
    vigencia,
    modosDisponibles: Object.entries(CAEA_MODO_LABELS).map(([value, label]) => ({
      value: Number(value) as CaeaModoEmision,
      label,
    })),
  })
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  if (auth.auth.rol !== "admin" && auth.auth.rol !== "contador") {
    return NextResponse.json({ error: "Sin permisos para modificar CAEA" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const config = await saveCaeaConfig(auth.auth.empresaId, parsed.data)
  invalidateConfigCache()

  const vigencia = await getCaeaVigencia(auth.auth.empresaId)
  return NextResponse.json({ config, vigencia })
}