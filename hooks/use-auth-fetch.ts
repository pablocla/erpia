import useSWR, { type SWRConfiguration } from "swr"
import { getToken } from "@/lib/stores/auth-store"

/* ═══════════════════════════════════════════════════════════════════════════
   useAuthFetch — SWR hook with automatic Zustand auth token injection.
   Replaces the `const token = localStorage.getItem("token")` pattern.
   
   Usage:
     const { data, error, isLoading } = useAuthFetch<Producto[]>("/api/productos")
   ═══════════════════════════════════════════════════════════════════════════ */

async function authFetcher<T>(url: string): Promise<T> {
  const token = getToken()
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const error: any = new Error("Error en la solicitud")
    error.status = res.status
    try {
      error.info = await res.json()
    } catch {}
    throw error
  }

  return res.json()
}

export function useAuthFetch<T = any>(
  url: string | null,
  config?: SWRConfiguration<T>,
) {
  return useSWR<T>(url, authFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    ...config,
  })
}
