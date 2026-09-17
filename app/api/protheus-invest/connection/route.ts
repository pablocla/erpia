import { NextRequest, NextResponse } from "next/server"
import { canManageUsers } from "@/lib/auth/admin-roles"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getEmpresaNombre, getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"
import { tenantRestReady } from "@/lib/protheus-invest/forward"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const [config, empresaNombre] = await Promise.all([
    getOpoConfig(auth.auth.empresaId),
    getEmpresaNombre(auth.auth.empresaId),
  ])
  const configured = tenantRestReady(config)

  return NextResponse.json({
    empresaId: auth.auth.empresaId,
    empresaNombre,
    rol: auth.auth.rol,
    canEdit: canManageUsers(auth.auth.rol),
    configured,
    baseUrl: config.restDirectUrl ?? "",
    user: config.restAuthUser ?? "",
    hasPassword: Boolean(config.restAuthPassword),
    origen: config.origen,
    accesoCanal: config.accesoCanal,
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  if (!canManageUsers(auth.auth.rol)) {
    return NextResponse.json({ error: "Solo dueño/admin parametriza el REST del tenant" }, { status: 403 })
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
