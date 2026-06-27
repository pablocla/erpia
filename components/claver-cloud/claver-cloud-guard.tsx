"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { setAuthTokenCookie, clearAuthTokenCookie } from "@/lib/auth/token-cookie"

const VERIFIED_KEY = "claver-cloud-verified"

type GuardState = "loading" | "ok" | "denied"

function readVerified(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(VERIFIED_KEY) === "1" && !!localStorage.getItem("token")
}

export function ClaverCloudGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const loginNextRef = useRef(pathname || "/claver-cloud")
  const [state, setState] = useState<GuardState>(() => (readVerified() ? "ok" : "loading"))
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (state === "ok") return

    let cancelled = false

    async function check() {
      const token = localStorage.getItem("token")
      if (!token) {
        const next = encodeURIComponent(loginNextRef.current)
        router.replace(`/login?next=${next}`)
        return
      }

      setAuthTokenCookie(token)

      try {
        const res = await fetch("/api/claver/analista/status", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          if (!cancelled) {
            sessionStorage.removeItem(VERIFIED_KEY)
            clearAuthTokenCookie()
            localStorage.removeItem("token")
            router.replace(`/login?next=${encodeURIComponent(loginNextRef.current)}`)
          }
          return
        }

        const data = (await res.json()) as { isAnalyst?: boolean; email?: string }
        if (!data.isAnalyst) {
          if (!cancelled) {
            sessionStorage.removeItem(VERIFIED_KEY)
            setMessage(
              `Tu usuario (${data.email ?? "sin email"}) no es analista Claver. Pedí acceso con tu email en CLAVER_ANALYST_EMAILS.`,
            )
            setState("denied")
          }
          return
        }

        if (!cancelled) {
          sessionStorage.setItem(VERIFIED_KEY, "1")
          setState("ok")
        }
      } catch {
        if (!cancelled) {
          setMessage("No se pudo verificar el acceso a Claver Cloud.")
          setState("denied")
        }
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [router, state])

  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando acceso Claver Cloud…</p>
      </div>
    )
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground max-w-md mx-auto text-center">
        <p className="text-lg font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => router.push("/dashboard")}
        >
          Volver al dashboard
        </button>
      </div>
    )
  }

  return <>{children}</>
}