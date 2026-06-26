import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"
import { CLAVIS_ENTITY_MAPPINGS } from "@/lib/opo/clavis-adapter"
import { PROTHEUS_DEMO_ENTITIES } from "@/lib/opo/protheus-demo"

const patchSchema = z.object({
  activo: z.boolean().optional(),
  modoErp: z.enum(["full", "legacy_front", "hibrido"]).optional(),
  origen: z.enum(["clavis_db", "protheus"]).optional(),
  conector: z.enum(["rest", "sql"]).optional(),
  baseUrl: z.string().optional(),
  agentApiKey: z.string().optional(),
  sqlViewPrefix: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const config = await getOpoConfig(auth.auth.empresaId)
  const entities = config.origen === "protheus" ? PROTHEUS_DEMO_ENTITIES : CLAVIS_ENTITY_MAPPINGS

  return NextResponse.json({
    config,
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

  const config = await patchOpoConfig(auth.auth.empresaId, parsed.data)
  return NextResponse.json({ config })
}