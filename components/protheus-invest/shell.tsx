"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Cable,
  HelpCircle,
  Landmark,
  LineChart,
  LogOut,
  ScrollText,
  Table2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/layout"
import { useCaja } from "@/lib/protheus-invest/store"
import { fetchTenantConnection, pullProtheusSnapshot } from "@/lib/protheus-invest/rest-client"
import { getToken, useAuthStore } from "@/lib/stores/auth-store"
import { performLogoutAndRedirect } from "@/lib/auth/session-client"
import { cn } from "@/lib/utils"
import { authFetch } from "@/lib/stores/auth-store"
import { ProtheusOnboardingGate } from "./onboarding"
import type { OnboardingState } from "@/lib/protheus-invest/onboarding"

/** Nombres de negocio. Las tablas SIGA van en Ayuda / boletín, no en el menú. */
const NAV_TESORERO = [
  { href: "/dashboard/protheus", label: "Cartera", icon: LineChart, exact: true },
  { href: "/dashboard/protheus/auditoria", label: "Auditoría Fiscal", icon: ScrollText },
  { href: "/dashboard/protheus/valuacion", label: "Valuación", icon: Table2 },
  { href: "/dashboard/protheus/bancos", label: "Bancos", icon: Landmark },
  { href: "/dashboard/protheus/asientos", label: "Movimientos", icon: ScrollText },
  { href: "/dashboard/protheus/ayuda", label: "Ayuda", icon: HelpCircle },
] as const

const NAV_ANALISTA = [
  ...NAV_TESORERO.slice(0, 4),
  { href: "/dashboard/protheus/auditoria", label: "Auditoría Fiscal", icon: ScrollText, exact: false as const },
  { href: "/dashboard/protheus/instrumentos", label: "Instrumentos", icon: BookOpen, exact: false as const },
  { href: "/dashboard/protheus/conexion", label: "Conexión", icon: Cable, exact: false as const },
  { href: "/dashboard/protheus/advpl", label: "Compilar", icon: BookOpen, exact: false as const },
  { href: "/dashboard/protheus/ayuda", label: "Ayuda", icon: HelpCircle, exact: false as const },
] as const

export function ProtheusInvestShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const source = useCaja((s) => s.source)
  const toasts = useCaja((s) => s.toasts)
  const user = useAuthStore((s) => s.user)
  const modoLite = user?.empresaModoLite
  const [gate, setGate] = useState<"load" | "onboarding" | "app">("load")
  const [perfil, setPerfil] = useState<"analista" | "tesorero" | null>(null)

  useEffect(() => {
    let cancelled = false
    authFetch("/api/protheus-invest/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: OnboardingState | null) => {
        if (cancelled) return
        setPerfil(data?.perfil ?? null)
        setGate(data?.completed ? "app" : "onboarding")
      })
      .catch(() => {
        if (!cancelled) setGate("onboarding")
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (gate === "load") {
    return <div className="flex h-[100dvh] items-center justify-center text-sm text-muted-foreground">Cargando…</div>
  }
  if (gate === "onboarding") {
    return (
      <ProtheusOnboardingGate
        onDone={(p) => {
          setPerfil(p)
          setGate("app")
        }}
      />
    )
  }

  const nav = perfil === "analista" ? NAV_ANALISTA : NAV_TESORERO

  return (
    <div className="flex h-[100dvh] bg-background text-foreground">
      <ProtheusBoot />
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card md:flex">
        <div className="border-b px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Claver</p>
          <p className="text-sm font-semibold tracking-tight">Inversiones</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add-on tesorería</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md px-3 text-sm",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        {modoLite !== "protheus" && (
          <div className="border-t p-2">
            <Link
              href="/dashboard"
              className="flex h-9 items-center rounded-md px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Volver al ERP Claver
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.empresaNombre ?? "Tenant Claver"}</p>
          </div>
          <StatusBadge
            variant={source === "protheus" ? "success" : "neutral"}
            label={source === "protheus" ? "Conectado" : "Demo"}
          />
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => performLogoutAndRedirect("/login?next=/dashboard/protheus")}
          >
            <LogOut className="size-3.5" />
            Salir
          </Button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b px-2 py-1 md:hidden">
          {nav.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1.5 text-xs",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>

      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-md border bg-card px-3 py-2 text-sm shadow-lg">
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProtheusBoot() {
  const hydrate = useCaja((s) => s.hydrateFromProtheus)
  const pushToast = useCaja((s) => s.pushToast)
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const loggedIn = Boolean(token || (typeof window !== "undefined" && getToken()))

  useEffect(() => {
    if (!isHydrated || !loggedIn) return
    let cancelled = false
    async function boot() {
      const conn = await fetchTenantConnection()
      if (cancelled || !conn?.configured) return
      try {
        const snap = await pullProtheusSnapshot()
        if (cancelled) return
        hydrate(snap)
      } catch {
        /* Conexión muestra el error */
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [isHydrated, loggedIn, hydrate, pushToast])

  return null
}
