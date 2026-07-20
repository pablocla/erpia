import useSWR, { type SWRConfiguration } from "swr"
import { getToken, useAuthStore } from "@/lib/stores/auth-store"

/* ═══════════════════════════════════════════════════════════════════════════
   useAuthFetch — SWR hook with automatic Zustand auth token injection.
   Replaces the `const token = localStorage.getItem("token")` pattern.
   
   Usage:
     const { data, error, isLoading } = useAuthFetch<Producto[]>("/api/productos")
   ═══════════════════════════════════════════════════════════════════════════ */

async function authFetcher<T>(url: string): Promise<T> {
  const token = getToken()
  if (!token) {
    const error: any = new Error("No autenticado")
    error.status = 401
    throw error
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const error: any = new Error("Error en la solicitud")
    error.status = res.status
    try {
      error.info = await res.json()
    } catch {}
    // Sesión inválida: limpiar store (evita spam 403 en demo fallida)
    if (
      (res.status === 401 || res.status === 403) &&
      (error.info?.code === "TOKEN_EXPIRED" || error.info?.code === "TOKEN_INVALID")
    ) {
      useAuthStore.getState().logout()
    }
    throw error
  }

  return res.json()
}

export function useAuthFetch<T = any>(
  url: string | null,
  config?: SWRConfiguration<T>,
) {
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const token = useAuthStore((s) => s.token)
  // No pegar al backend sin sesión (bug demo: requests anónimas en cascada)
  const hasSession = Boolean(token || (typeof window !== "undefined" && getToken()))
  const key = url && isHydrated && hasSession ? url : null

  return useSWR<T>(key, authFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    ...config,
  })
}
