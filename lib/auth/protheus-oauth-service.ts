import { prisma } from "@/lib/prisma"
import { AuthService } from "@/lib/auth/auth-service"
import { getOpoConfig } from "@/lib/opo/opo-config-service"
import { tenantRestReady } from "@/lib/protheus-invest/forward"
import { ensureProtheusTenantSlug, findEmpresaByProtheusSlug } from "@/lib/protheus-invest/tenant-url"
import { logProtheusProxy } from "@/lib/claver-cloud/protheus-fleet"

const authService = new AuthService()

export type ProtheusAuthResult =
  | {
      success: true
      token: string
      usuario: {
        id: number
        nombre: string
        email: string
        rol: string
        empresaId: number
        empresaNombre?: string
        empresaModoLite?: string | null
        authProvider: string
      }
    }
  | { success: false; error: string; status: number }

function normalizeBase(url: string) {
  return url.trim().replace(/\/$/, "")
}

function safeUser(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, ".")
}

export async function requestProtheusUserToken(input: {
  baseUrl: string
  username: string
  password: string
}): Promise<{ ok: boolean; accessToken?: string; via: "oauth2" | "basic"; error?: string; status: number }> {
  const base = normalizeBase(input.baseUrl)
  const tokenUrls = [`${base}/api/oauth2/v1/token`, `${base}/api/oauth2/token`]
  const bodyJson = JSON.stringify({
    grant_type: "password",
    username: input.username,
    password: input.password,
  })
  const form = new URLSearchParams({
    grant_type: "password",
    username: input.username,
    password: input.password,
  })

  for (const url of tokenUrls) {
    for (const init of [
      { headers: { "Content-Type": "application/json", Accept: "application/json" }, body: bodyJson },
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: form.toString(),
      },
    ] as RequestInit[]) {
      try {
        const res = await fetch(url, { method: "POST", ...init, signal: AbortSignal.timeout(15_000) })
        const text = await res.text()
        let json: Record<string, unknown> = {}
        try {
          json = JSON.parse(text) as Record<string, unknown>
        } catch {
          /* raw */
        }
        const token =
          (typeof json.access_token === "string" && json.access_token) ||
          (typeof json.accessToken === "string" && json.accessToken) ||
          ""
        if (res.ok && token) return { ok: true, accessToken: token, via: "oauth2", status: res.status }
        if (res.status === 401 || res.status === 403) {
          return { ok: false, via: "oauth2", status: res.status, error: "Usuario o clave Protheus inválidos" }
        }
      } catch {
        /* probar siguiente */
      }
    }
  }

  const health = `${base}/api/claver/v1/investments/health`
  try {
    const basic = Buffer.from(`${input.username}:${input.password}`).toString("base64")
    const res = await fetch(health, {
      headers: { Authorization: `Basic ${basic}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    })
    if (res.status === 401) {
      return { ok: false, via: "basic", status: 401, error: "Usuario o clave Protheus inválidos" }
    }
    if (res.ok || res.status === 403 || res.status === 404) {
      return { ok: true, via: "basic", status: res.status }
    }
    return { ok: false, via: "basic", status: res.status, error: `Protheus HTTP ${res.status}` }
  } catch (err) {
    return {
      ok: false,
      via: "basic",
      status: 0,
      error: err instanceof Error ? err.message : "No se alcanzó el AppServer",
    }
  }
}

export async function authenticateProtheusSubuser(input: {
  slug: string
  username: string
  password?: string
  accessToken?: string
}): Promise<ProtheusAuthResult> {
  const username = input.username.trim()
  if (!username) return { success: false, error: "Usuario Protheus requerido", status: 400 }

  const empresa = await findEmpresaByProtheusSlug(input.slug)
  if (!empresa) return { success: false, error: "Tenant no encontrado", status: 404 }

  const config = await getOpoConfig(empresa.id)
  if (!tenantRestReady(config) && !config.restDirectUrl?.trim()) {
    return {
      success: false,
      error: "Este tenant todavía no tiene REST Protheus. El analista tiene que exponerlo.",
      status: 412,
    }
  }

  const baseUrl = config.restDirectUrl!.trim()
  let via: "oauth2" | "basic" | "bearer" = "oauth2"

  if (input.accessToken?.trim()) {
    via = "bearer"
    const probe = await fetch(`${normalizeBase(baseUrl)}/api/claver/v1/investments/health`, {
      headers: { Authorization: `Bearer ${input.accessToken.trim()}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null)
    if (!probe || probe.status === 401) {
      return { success: false, error: "Token Protheus inválido o vencido", status: 401 }
    }
  } else {
    if (!input.password) return { success: false, error: "Contraseña Protheus requerida", status: 400 }
    const tokenRes = await requestProtheusUserToken({
      baseUrl,
      username,
      password: input.password,
    })
    via = tokenRes.via
    if (!tokenRes.ok) {
      return { success: false, error: tokenRes.error ?? "No se pudo autenticar en Protheus", status: tokenRes.status || 401 }
    }
  }

  const key = `pth:${empresa.id}:${safeUser(username)}`
  const email = `${safeUser(username)}.${empresa.id}@protheus.claver.local`

  let usuario = await prisma.usuario.findFirst({
    where: { OR: [{ googleId: key }, { email }] },
  })

  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        nombre: username,
        email,
        password: null,
        authProvider: "protheus",
        googleId: key,
        rol: "vendedor",
        activo: true,
        empresaId: empresa.id,
      },
    })
  } else if (usuario.empresaId !== empresa.id || usuario.deletedAt) {
    return { success: false, error: "Usuario no habilitado en este tenant", status: 403 }
  } else if (!usuario.activo) {
    return { success: false, error: "Usuario desactivado", status: 403 }
  } else if (usuario.authProvider !== "protheus") {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { authProvider: "protheus", googleId: key },
    })
  }

  const token = await authService.generarToken({
    userId: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    empresaId: usuario.empresaId,
  })

  await logProtheusProxy({
    empresaId: empresa.id,
    method: "AUTH",
    path: `/oauth2/${via}`,
    ok: true,
    status: 200,
    ms: 0,
  })

  return {
    success: true,
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
      empresaNombre: empresa.razonSocial || empresa.nombre,
      empresaModoLite: empresa.modoLite,
      authProvider: "protheus",
    },
  }
}

export async function publicTenantCard(slug: string) {
  const empresa = await findEmpresaByProtheusSlug(slug)
  if (!empresa) return null
  const slugFixed = await ensureProtheusTenantSlug(empresa.id)
  const config = await getOpoConfig(empresa.id)
  return {
    slug: slugFixed,
    nombre: empresa.razonSocial || empresa.nombre,
    loginPath: `/tenant/${slugFixed}/login`,
    restReady: tenantRestReady(config),
  }
}
