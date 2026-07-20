import { resolvePostLoginPathAsync } from "@/lib/auth/home-redirect"
import { appendPresentQuery } from "@/lib/comercial/demo-presentation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { setAuthTokenCookie } from "@/lib/auth/token-cookie"

type DemoUsuario = {
  id: number
  nombre: string
  email: string
  rol: string
  empresaId: number
}

type LaunchResult = {
  token: string
  usuario: DemoUsuario
  /** Path de destino sin query `present` */
  dest: string
}

/** Tiempo máximo de espera del provision (alineado a maxDuration del API). */
const DEMO_FETCH_TIMEOUT_MS = 55_000

/**
 * Dedup de provision: React Strict Mode y re-montajes pueden disparar 2 POST
 * y saturar el backend creando empresas huérfanas.
 */
const inflightByKey = new Map<string, Promise<LaunchResult>>()
const recentByKey = new Map<string, { result: LaunchResult; at: number }>()
const RECENT_TTL_MS = 8_000

function safeDashboardPath(path: string | null | undefined): string | null {
  const p = path?.trim()
  if (!p || !p.startsWith("/") || p.startsWith("//")) return null
  return p
}

function persistDemoSession(token: string, usuario: DemoUsuario) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token)
    setAuthTokenCookie(token)
  }
  useAuthStore.getState().login(token, {
    id: String(usuario.id),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    empresaId: usuario.empresaId,
  })
}

async function provisionIndustryDemoOnce(
  industryId: string,
  options?: { activar?: string | null },
): Promise<LaunchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEMO_FETCH_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch("/api/onboarding/industry-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industryId,
        activar: options?.activar?.trim() || undefined,
      }),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "La demo tardó demasiado en armarse. Revisá tu conexión e intentá de nuevo en unos segundos.",
      )
    }
    throw new Error("No se pudo conectar con el servidor de demos. Intentá de nuevo.")
  } finally {
    clearTimeout(timer)
  }

  let data: {
    success?: boolean
    error?: string
    token?: string
    usuario?: DemoUsuario
    goldenPath?: string
  }
  try {
    data = await res.json()
  } catch {
    throw new Error(
      res.ok
        ? "Respuesta inválida del servidor"
        : `Error del servidor (${res.status}). Intentá de nuevo.`,
    )
  }

  if (!res.ok || !data.success || !data.token || !data.usuario) {
    throw new Error(data.error ?? "No se pudo armar la demo")
  }

  const golden = safeDashboardPath(data.goldenPath)
  let dest: string
  if (golden) {
    dest = golden
  } else {
    try {
      dest = await resolvePostLoginPathAsync(
        data.token,
        data.usuario.rol,
        data.goldenPath,
        data.usuario.email,
      )
    } catch {
      dest = "/dashboard"
    }
  }

  return {
    token: data.token,
    usuario: data.usuario,
    dest,
  }
}

export async function launchIndustryDemo(
  industryId: string,
  loginConToken: (token: string, usuario: DemoUsuario) => void,
  options?: { present?: boolean; activar?: string | null },
): Promise<string> {
  const activar = options?.activar?.trim() || ""
  const cacheKey = `${industryId}::${activar}`

  const applySession = (result: LaunchResult) => {
    // Persistir sesión ANTES de devolver el path (evita race con dashboard)
    persistDemoSession(result.token, result.usuario)
    loginConToken(result.token, result.usuario)
    return appendPresentQuery(result.dest, options?.present)
  }

  const recent = recentByKey.get(cacheKey)
  if (recent && Date.now() - recent.at < RECENT_TTL_MS) {
    return applySession(recent.result)
  }

  let promise = inflightByKey.get(cacheKey)
  if (!promise) {
    promise = provisionIndustryDemoOnce(industryId, options)
      .then((result) => {
        recentByKey.set(cacheKey, { result, at: Date.now() })
        return result
      })
      .finally(() => {
        setTimeout(() => {
          if (inflightByKey.get(cacheKey) === promise) {
            inflightByKey.delete(cacheKey)
          }
        }, 0)
      })
    inflightByKey.set(cacheKey, promise)
  }

  const result = await promise
  return applySession(result)
}
