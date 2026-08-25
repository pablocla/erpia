"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setAuthTokenCookie } from "@/lib/auth/token-cookie"
import { clearClientSession } from "@/lib/auth/session-client"
import {
  decideClaverCloudAccess,
  isCloudSessionVerified,
  markCloudSessionVerified,
  clearCloudSessionVerified,
} from "@/lib/auth/claver-cloud-access"

type GuardState = "loading" | "ok" | "denied" | "unavailable"

export function ClaverCloudGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const loginNextRef = useRef(pathname || "/claver-cloud")
  const [state, setState] = useState<GuardState>("loading")
  const [message, setMessage] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (state !== "loading") return

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token && isCloudSessionVerified(token)) {
      setAuthTokenCookie(token)
      setState("ok")
      return
    }

    let cancelled = false

    async function check() {
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

        const data = (await res.json().catch(() => ({}))) as {
          authenticated?: boolean
          isAnalyst?: boolean
          email?: string
        }

        const decision = decideClaverCloudAccess({
          hasToken: true,
          httpStatus: res.status,
          authenticated: data.authenticated,
          isAnalyst: data.isAnalyst,
          email: data.email,
        })

        if (cancelled) return

        if (decision.action === "ok") {
          markCloudSessionVerified(token)
          setState("ok")
          return
        }

        if (decision.action === "login") {
          clearClientSession()
          router.replace(`/login?next=${encodeURIComponent(loginNextRef.current)}`)
          return
        }

        if (decision.action === "unavailable") {
          setMessage("No se pudo verificar el acceso a Claver Cloud. Probá de nuevo.")
          setState("unavailable")
          return
        }

        clearCloudSessionVerified()
        setMessage(
          decision.email
            ? `Tu usuario (${decision.email}) no tiene acceso de analista Claver. Pedí que te habiliten la cuenta.`
            : "Tu usuario no tiene acceso de analista Claver. Pedí que te habiliten la cuenta.",
        )
        setState("denied")
      } catch {
        if (!cancelled) {
          setMessage("No se pudo verificar el acceso a Claver Cloud. Probá de nuevo.")
          setState("unavailable")
        }
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [router, state, retryKey])

  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando acceso Claver Cloud…</p>
      </div>
    )
  }

  if (state === "unavailable") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground max-w-md mx-auto text-center">
        <p className="text-lg font-semibold tracking-tight">No pudimos verificar el acceso</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setState("loading")
              setRetryKey((k) => k + 1)
            }}
          >
            Reintentar
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
            Ir al dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground max-w-md mx-auto text-center">
        <ShieldOff className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-lg font-semibold tracking-tight">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
            Volver al dashboard
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clearClientSession()
              router.replace(`/login?next=${encodeURIComponent(loginNextRef.current)}`)
            }}
          >
            Ingresar con otra cuenta
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
