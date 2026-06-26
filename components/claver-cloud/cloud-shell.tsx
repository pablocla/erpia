"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Building2, Menu, Search, Server } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { isNavItemActive, navSections } from "@/lib/claver-cloud/nav-config"

type TenantHit = {
  id: number
  nombre: string
  razonSocial: string
  cuit?: string | null
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function TenantSearch() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [tenants, setTenants] = React.useState<TenantHit[]>([])
  const [open, setOpen] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/claver/ops/clientes", { headers: authHeaders() })
        if (!res.ok) return
        const data = (await res.json()) as { data?: TenantHit[] }
        if (!cancelled) {
          setTenants(Array.isArray(data.data) ? data.data : [])
          setLoaded(true)
        }
      } catch {
        /* ignore */
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const q = query.trim().toLowerCase()
  const results =
    q.length < 1
      ? []
      : tenants
          .filter((t) => {
            const idMatch = String(t.id).includes(q)
            const nameMatch =
              t.nombre.toLowerCase().includes(q) ||
              t.razonSocial.toLowerCase().includes(q)
            const cuitMatch = t.cuit?.replace(/-/g, "").includes(q.replace(/-/g, ""))
            return idMatch || nameMatch || cuitMatch
          })
          .slice(0, 8)

  const goToTenant = (id: number) => {
    setOpen(false)
    setQuery("")
    router.push(`/claver-cloud/tenants/${id}`)
  }

  return (
    <div ref={containerRef} className="relative ml-auto flex-1 md:grow-0 w-full sm:w-auto">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Buscar tenant por ID, CUIT o nombre…"
        className="w-full rounded-lg bg-background pl-8 md:w-[280px] lg:w-[360px]"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            e.preventDefault()
            goToTenant(results[0].id)
          }
          if (e.key === "Escape") setOpen(false)
        }}
      />
      {open && q.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {!loaded ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Cargando tenants…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados para &quot;{query}&quot;</p>
          ) : (
            <ul className="max-h-64 overflow-auto py-1">
              {results.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => goToTenant(t.id)}
                  >
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-medium">{t.nombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        ID {t.id}
                        {t.cuit ? ` · CUIT ${t.cuit}` : ""} · {t.razonSocial}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function NavLinks({
  pathname,
  onNavigate,
  compact,
}: {
  pathname: string
  onNavigate?: () => void
  compact?: boolean
}) {
  return (
    <>
      {navSections.map((section) => (
        <div key={section.label} className={compact ? "grid gap-3" : "mb-4"}>
          <p
            className={cn(
              "px-3 font-semibold uppercase tracking-wider text-muted-foreground",
              compact ? "text-xs" : "text-[10px] mb-1",
            )}
          >
            {section.label}
          </p>
          {section.items.map((item) => {
            const active = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg transition-all hover:text-primary",
                  compact ? "gap-4 px-2.5 py-1 text-base" : "px-3 py-2 text-sm",
                  active
                    ? compact
                      ? "text-foreground font-medium"
                      : "bg-muted text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className={compact ? "h-5 w-5" : "h-4 w-4"} />
                {item.name}
              </Link>
            )
          })}
        </div>
      ))}
    </>
  )
}

export function CloudShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground dark">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mt-0 sm:mt-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs dark overflow-y-auto">
            <Link
              href="/claver-cloud"
              onClick={() => setMobileOpen(false)}
              className="mb-6 flex items-center gap-2 font-semibold"
            >
              <Server className="h-5 w-5" />
              Claver Cloud
            </Link>
            <nav className="grid gap-2">
              <NavLinks pathname={pathname} compact onNavigate={() => setMobileOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex-1 sm:hidden" />

        <TenantSearch />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden sm:flex w-64 flex-col border-r bg-background shrink-0">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/claver-cloud" className="flex items-center gap-2 font-semibold">
              <Server className="h-5 w-5" />
              <span>Claver Cloud</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-3">
            <nav className="px-2 lg:px-3">
              <NavLinks pathname={pathname} />
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}