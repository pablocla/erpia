import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  PROPIEDAD_ONBOARDING_STEPS,
  cerrarOnboardingPropiedad,
  marcarPasoPropiedad,
  obtenerOnboardingPropiedad,
  onboardingPropiedadPendiente,
  type PropiedadOnboardingStepId,
} from "@/lib/comercial/propiedad-onboarding"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const state = await obtenerOnboardingPropiedad(auth.auth.empresaId)
  return NextResponse.json({
    steps: PROPIEDAD_ONBOARDING_STEPS,
    state,
    pendiente: onboardingPropiedadPendiente(state),
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const action = body.action as string

  if (action === "dismiss") {
    await cerrarOnboardingPropiedad(auth.auth.empresaId)
    return NextResponse.json({ ok: true })
  }

  if (action === "completar" && body.stepId) {
    const state = await marcarPasoPropiedad(
      auth.auth.empresaId,
      body.stepId as PropiedadOnboardingStepId,
    )
    return NextResponse.json({ state, pendiente: onboardingPropiedadPendiente(state) })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}