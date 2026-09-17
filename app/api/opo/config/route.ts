import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"
import { maskOpoSecrets } from "@/lib/protheus-invest/forward"
import { canManageUsers } from "@/lib/auth/admin-roles"
import { CLAVER_ENTITY_MAPPINGS } from "@/lib/opo/claver-adapter"
import { PROTHEUS_DEMO_ENTITIES } from "@/lib/opo/protheus-demo"

const patchSchema = z.object({
  activo: z.boolean().optional(),
  modoErp: z.enum(["full", "legacy_front", "hibrido"]).optional(),
  origen: z.enum(["claver_db", "protheus"]).optional(),
  conector: z.enum(["rest", "sql"]).optional(),
  accesoCanal: z.enum(["edge_agent", "rest_directo", "sql_vistas", "sql_directo"]).optional(),
  baseUrl: z.string().optional(),
  agentApiKey: z.string().optional(),
  sqlViewPrefix: z.string().optional(),
  restDirectUrl: z.string().optional(),
  restAuthUser: z.string().optional(),
  restAuthPassword: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const config = await getOpoConfig(auth.auth.empresaId)
  const entities = config.origen === "protheus" ? PROTHEUS_DEMO_ENTITIES : CLAVER_ENTITY_MAPPINGS

  return NextResponse.json({
    config: maskOpoSecrets(config),
    entities,
    discoveryUrl: `${request.nextUrl.origin}/api/opo/discovery`,
    wellKnownUrl: `${request.nextUrl.origin}/.well-known/opo.json`,
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const patch = { ...parsed.data }
  if (patch.restAuthPassword || patch.restDirectUrl || patch.restAuthUser) {
    if (!canManageUsers(auth.auth.rol)) {
      return NextResponse.json({ error: "Solo dueño/admin cambia el REST Protheus" }, { status: 403 })
    }
  }
  if (patch.restAuthPassword === "••••••••") delete patch.restAuthPassword

  const config = await patchOpoConfig(auth.auth.empresaId, patch)
  return NextResponse.json({ config: maskOpoSecrets(config) })
}