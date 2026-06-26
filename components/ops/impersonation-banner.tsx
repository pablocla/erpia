"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseJwtPayload } from "@/lib/auth/session-client"
import { useAuthStore } from "@/lib/stores"

export function ImpersonationBanner() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const login = useAuthStore((s) => s.login)
  const [meta, setMeta] = useState<{ by: string; empresa?: string } | null>(null)

  useEffect(() => {
    const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null)
    if (!t) return
    const payload = parseJwtPayload(t)
    if (payload?.impersonating === true) {
      setMeta({
        by: String(payload.impersonatedBy ?? payload.analystEmail ?? "analista"),
        empresa: user?.empresaNombre ?? `Tenant #${payload.empresaId}`,
      })
    } else {
      setMeta(null)
    }
  }, [token, user])

  if (!meta) return null

  const salir = () => {
    const analystToken = sessionStorage.getItem("claver_analyst_token")
    const analystUser = sessionStorage.getItem("claver_analyst_user")
    sessionStorage.removeItem("claver_analyst_token")
    sessionStorage.removeItem("claver_analyst_user")
    if (analystToken && analystUser) {
      try {
        login(analystToken, JSON.parse(analystUser))
        window.location.href = "/claver-cloud/superadmin"
        return
      } catch {
        /* fallback logout */
      }
    }
    logout()
    window.location.href = "/claver-cloud"
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm">
      <div className="flex items-center gap-2 text-amber-950 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Sesión impersonada — <strong>{meta.empresa}</strong> (analista: {meta.by})
        </span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
          <Link href="/claver-cloud/superadmin">Volver a Cloud</Link>
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={salir}>
          <LogOut className="h-3 w-3 mr-1" />
          Salir impersonación
        </Button>
      </div>
    </div>
  )
}