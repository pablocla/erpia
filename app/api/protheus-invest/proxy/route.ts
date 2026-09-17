import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getOpoConfig } from "@/lib/opo/opo-config-service"
import { credentialsFromOpo, forwardToProtheus, tenantRestReady } from "@/lib/protheus-invest/forward"

/**
 * Proxy por tenant: cada empresa usa SU restDirectUrl de OpoTenantConfig.
 * El browser nunca manda usuario/clave del AppServer.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const payload = (await request.json()) as { method?: string; path?: string; body?: unknown }
  const config = await getOpoConfig(auth.auth.empresaId)
  if (!tenantRestReady(config)) {
    return NextResponse.json(
      {
        ok: false,
        status: 412,
        ms: 0,
        body: null,
        error: "Este tenant no tiene REST Protheus precargado. Configuralo en OPO / Legacy Bridge.",
      },
      { status: 412 },
    )
  }

  const creds = credentialsFromOpo(config)
  const result = await forwardToProtheus({
    ...creds,
    method: payload.method ?? "GET",
    path: payload.path ?? "",
    body: payload.body,
  })
  return NextResponse.json(result)
}
