"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ClientPortalShell } from "@/components/claver-cliente/client-portal-shell"

export default function ClaverClienteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (pathname === "/claver-cliente/login") {
      setReady(true)
      return
    }
    const token = localStorage.getItem("token")
    const raw = localStorage.getItem("usuario")
    if (!token || !raw) {
      router.replace("/claver-cliente/login")
      return
    }
    try {
      const u = JSON.parse(raw)
      if (u.rol !== "stakeholder") {
        router.replace("/dashboard")
        return
      }
    } catch {
      router.replace("/claver-cliente/login")
      return
    }
    setReady(true)
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (pathname === "/claver-cliente/login") return <>{children}</>

  return <ClientPortalShell>{children}</ClientPortalShell>
}