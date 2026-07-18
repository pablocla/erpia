import { resolvePostLoginPathAsync } from "@/lib/auth/home-redirect"
import { appendPresentQuery } from "@/lib/comercial/demo-presentation"

type DemoUsuario = {
  id: number
  nombre: string
  email: string
  rol: string
  empresaId: number
}

/** Tiempo máximo de espera del provision (alineado a maxDuration del API). */
const DEMO_FETCH_TIMEOUT_MS = 55_000

function safeDashboardPath(path: string | null | undefined): string | null {
  const p = path?.trim()
  if (!p || !p.startsWith("/") || p.startsWith("//")) return null
  return p
}

export async function launchIndustryDemo(
  industryId: string,
  loginConToken: (token: string, usuario: DemoUsuario) => void,
  options?: { present?: boolean; activar?: string | null },
): Promise<string> {
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

  loginConToken(data.token, data.usuario)

  // Camino rápido: goldenPath del provision (evita /api/claver/analista + /api/config/empresa que cuelgan en 4G)
  const golden = safeDashboardPath(data.goldenPath)
  if (golden) {
    return appendPresentQuery(golden, options?.present)
  }

  try {
    const dest = await resolvePostLoginPathAsync(
      data.token,
      data.usuario.rol,
      data.goldenPath,
      data.usuario.email,
    )
    return appendPresentQuery(dest, options?.present)
  } catch {
    return appendPresentQuery("/dashboard", options?.present)
  }
}
