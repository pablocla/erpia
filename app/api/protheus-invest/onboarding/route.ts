import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  getUserOnboarding,
  maxStepForPerfil,
  patchUserOnboarding,
  type ProtheusPerfil,
} from "@/lib/protheus-invest/onboarding"
import { tenantRestReady } from "@/lib/protheus-invest/forward"
import { getOpoConfig } from "@/lib/opo/opo-config-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const [state, config] = await Promise.all([
    getUserOnboarding(auth.auth.empresaId, auth.auth.userId),
    getOpoConfig(auth.auth.empresaId),
  ])
  return NextResponse.json({
    ...state,
    restReady: tenantRestReady(config),
    maxStep: maxStepForPerfil(state.perfil),
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const body = (await request.json()) as {
    perfil?: ProtheusPerfil | null
    step?: number
    completed?: boolean
  }
  if (body.perfil != null && body.perfil !== "analista" && body.perfil !== "tesorero") {
    return NextResponse.json({ error: "Perfil inválido" }, { status: 400 })
  }
  const next = await patchUserOnboarding(auth.auth.empresaId, auth.auth.userId, body)
  return NextResponse.json({ ...next, maxStep: maxStepForPerfil(next.perfil) })
}
