import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { runLegacyBridgeTest } from "@/lib/opo/bridge-test-service"
import { getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"
import type { OpoTenantConfig } from "@/lib/opo/types"

const bodySchema = z.object({
  config: z
    .object({
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
      entityMappings: z.array(z.any()).optional(),
    })
    .optional(),
})

export async function POST(
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

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const current = await getOpoConfig(id)
  const overlay = parsed.data.config ?? {}
  if (overlay.restAuthPassword === "••••••••") {
    overlay.restAuthPassword = current.restAuthPassword
  }

  const testConfig: OpoTenantConfig = { ...current, ...overlay }
  const testResult = await runLegacyBridgeTest(testConfig)

  await patchOpoConfig(id, {
    bridgeTestedAt: testResult.testedAt,
    bridgeTestOk: testResult.ok,
  })

  return NextResponse.json({ testResult })
}