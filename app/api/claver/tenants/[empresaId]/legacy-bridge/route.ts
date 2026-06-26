import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { runLegacyBridgeTest } from "@/lib/opo/bridge-test-service"
import { PROTHEUS_DEFAULT_MAPPINGS } from "@/lib/opo/entity-mappings-default"
import { buildClavisDiscoveryManifest } from "@/lib/opo/clavis-adapter"
import { getEmpresaNombre, getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"

const patchSchema = z.object({
  modoErp: z.enum(["full", "legacy_front", "hibrido"]).optional(),
  origen: z.enum(["clavis_db", "protheus"]).optional(),
  conector: z.enum(["rest", "sql"]).optional(),
  accesoCanal: z.enum(["edge_agent", "rest_directo", "sql_vistas"]).optional(),
  sqlModo: z.enum(["direct", "via_rest"]).optional(),
  baseUrl: z.string().optional(),
  agentApiKey: z.string().optional(),
  sqlViewPrefix: z.string().optional(),
  restDirectUrl: z.string().optional(),
  restAuthUser: z.string().optional(),
  restAuthPassword: z.string().optional(),
  sqlServer: z.string().optional(),
  sqlPort: z.number().optional(),
  sqlDatabase: z.string().optional(),
  sqlUser: z.string().optional(),
  sqlPassword: z.string().optional(),
  tableSuffix: z.string().optional(),
  entityMappings: z.array(z.any()).optional(),
  activo: z.boolean().optional(),
  runTest: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const { empresaId } = await params
  const id = Number(empresaId)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  const ctx = await getClaverAnalystEmpresaContext(request, id)
  if (!ctx.ok) return ctx.response

  const config = await getOpoConfig(id)
  const orgName = await getEmpresaNombre(id)

  return NextResponse.json({
    config: {
      ...config,
      restAuthPassword: config.restAuthPassword ? "••••••••" : "",
    },
    defaultMappings: PROTHEUS_DEFAULT_MAPPINGS,
    discoveryHint: "GET {restDirectUrl}/tlpp/rest/list/service",
    entities: buildClavisDiscoveryManifest("", orgName).supported_entities ?? [],
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const { empresaId } = await params
  const id = Number(empresaId)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  const ctx = await getClaverAnalystEmpresaContext(request, id)
  if (!ctx.ok) return ctx.response

  const body = patchSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  const { runTest, ...patch } = body.data
  const current = await getOpoConfig(id)

  if (patch.restAuthPassword === "••••••••") {
    delete patch.restAuthPassword
  }

  const isLegacy = (patch.modoErp ?? current.modoErp) !== "full"
  const next = await patchOpoConfig(id, {
    ...patch,
    activo: patch.activo ?? (isLegacy ? true : current.activo),
    origen: patch.origen ?? (isLegacy ? "protheus" : "clavis_db"),
    entityMappings: patch.entityMappings ?? current.entityMappings ?? PROTHEUS_DEFAULT_MAPPINGS,
  })

  let testResult = null
  if (runTest) {
    testResult = await runLegacyBridgeTest(next)
    await patchOpoConfig(id, {
      bridgeTestedAt: testResult.testedAt,
      bridgeTestOk: testResult.ok,
    })
  }

  return NextResponse.json({
    config: { ...next, restAuthPassword: next.restAuthPassword ? "••••••••" : "" },
    testResult,
  })
}