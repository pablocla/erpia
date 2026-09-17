import { NextRequest, NextResponse } from "next/server"
import { canManageUsers } from "@/lib/auth/admin-roles"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getEmpresaNombre, getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"
import { tenantRestReady } from "@/lib/protheus-invest/forward"
import { getUserOnboarding } from "@/lib/protheus-invest/onboarding"
import { ensureProtheusTenantSlug, tenantLoginPath } from "@/lib/protheus-invest/tenant-url"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const [config, empresaNombre, onboarding] = await Promise.all([
    getOpoConfig(auth.auth.empresaId),
    getEmpresaNombre(auth.auth.empresaId),
    getUserOnboarding(auth.auth.empresaId, auth.auth.userId),
  ])
  const configured = tenantRestReady(config)
  const slug = await ensureProtheusTenantSlug(auth.auth.empresaId)

  return NextResponse.json({
    empresaId: auth.auth.empresaId,
    empresaNombre,
    rol: auth.auth.rol,
    canEdit: canManageUsers(auth.auth.rol) || onboarding.perfil === "analista",
    perfil: onboarding.perfil,
    configured,
    baseUrl: config.restDirectUrl ?? "",
    user: config.restAuthUser ?? "",
    hasPassword: Boolean(config.restAuthPassword),
    origen: config.origen,
    accesoCanal: config.accesoCanal,
    loginPath: tenantLoginPath(slug),
    slug,
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const onboarding = await getUserOnboarding(auth.auth.empresaId, auth.auth.userId)
  const puedeEditar = canManageUsers(auth.auth.rol) || onboarding.perfil === "analista"
  if (!puedeEditar) {
    return NextResponse.json({ error: "Solo el analista Protheus o un admin carga el REST" }, { status: 403 })
  }

  const body = (await request.json()) as {
    restDirectUrl?: string
    restAuthUser?: string
    restAuthPassword?: string
  }

  const current = await getOpoConfig(auth.auth.empresaId)
  const password =
    !body.restAuthPassword || body.restAuthPassword === "••••••••"
      ? current.restAuthPassword
      : body.restAuthPassword

  const next = await patchOpoConfig(auth.auth.empresaId, {
    activo: true,
    origen: "protheus",
    conector: "rest",
    accesoCanal: "rest_directo",
    restDirectUrl: body.restDirectUrl ?? current.restDirectUrl,
    restAuthUser: body.restAuthUser ?? current.restAuthUser,
    restAuthPassword: password,
  })

  return NextResponse.json({
    configured: tenantRestReady(next),
    baseUrl: next.restDirectUrl ?? "",
    user: next.restAuthUser ?? "",
    hasPassword: Boolean(next.restAuthPassword),
  })
}
