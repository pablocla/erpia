import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getOpoConfig } from "@/lib/opo/opo-config-service"
import { isRemoteAgentConfigured, pingRemoteAgent } from "@/lib/opo/remote-agent"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const config = await getOpoConfig(auth.auth.empresaId)
  if (!isRemoteAgentConfigured(config)) {
    return NextResponse.json(
      { ok: false, message: "Configurá baseUrl del agente (ej. http://192.168.100.3:4077)" },
      { status: 400 },
    )
  }

  try {
    const health = await pingRemoteAgent(config)
    return NextResponse.json({ ok: true, health, baseUrl: config.baseUrl })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Sin conexión al agente",
        baseUrl: config.baseUrl,
      },
      { status: 502 },
    )
  }
}