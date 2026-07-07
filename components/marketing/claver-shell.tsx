"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X, Cloud, LayoutGrid, MonitorPlay, Receipt, Mail, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { CLAVER_NAV, CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { CombateAppsMegaMenu } from "@/components/marketing/combate-apps-mega-menu"
import { Button } from "@/components/ui/button"

interface ClaverShellProps {
  children: React.ReactNode
  /** Matriz Claver, Claver o Clavergrow */
  context?: "matrix" | "claverp" | "clavergrow"
  theme?: "dark-hero" | "light"
}

const LOGO_HREF = {
  matrix: "/",
  claverp: "/claver/claverp",
  clavergrow: "/claver/clavergrow",
} as const

const LOGO_VARIANT = {
  matrix: "group-full",
  claverp: "claverp-full",
  clavergrow: "clavergrow-full",
} as const

export function ClaverShell({ children, context = "matrix", theme = "dark-hero" }: ClaverShellProps) {
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [navOpen])

  const navDark = theme === "dark-hero" || scrolled

  const navLinkClass = cn(
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    navDark
      ? "text-slate-300 hover:bg-white/10 hover:text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  )

  const ghostActionClass = cn(
    "text-sm",
    navDark ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:text-slate-900",
  )

  return (
    <div className="min-h-screen">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          navDark
            ? "border-b border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-lg shadow-black/5"
            : "bg-white/80 backdrop-blur-md border-b border-slate-200/60",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-6">
          <Link href={LOGO_HREF[context]} className="shrink-0">
            <BrandLogo
              size="sm"
              theme={navDark ? "dark" : "light"}
              variant={LOGO_VARIANT[context]}
            />
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Navegación principal"
          >
            <CombateAppsMegaMenu dark={navDark} />
            {CLAVER_NAV.filter((item) => !item.href.includes("/claver/apps")).map((item) => {
              const Icon = 
                item.href.includes("apps") ? LayoutGrid :
                item.href.includes("claverp") && !item.href.includes("precios") ? Server :
                item.href.includes("demo") ? MonitorPlay :
                item.href.includes("precios") ? Receipt :
                item.href.includes("contacto") ? Mail :
                Cloud;
              
              return (
                <Link key={item.href} href={item.href} className={cn(navLinkClass, "flex items-center gap-2")}>
                  <Icon className="h-4 w-4 opacity-70" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" className={ghostActionClass} asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              asChild
            >
              <Link href="/login/register?trial=14">
                Probar gratis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <button
            type="button"
            className={cn(
              "ml-auto rounded-lg p-2 lg:ml-0 lg:hidden",
              navDark ? "text-white" : "text-slate-900",
            )}
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
            aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {navOpen && (
          <div
            className={cn(
              "border-t px-4 py-4 lg:hidden",
              navDark ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white",
            )}
          >
            <nav className="flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto" aria-label="Menú móvil">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Apps combate
              </p>
              <Link
                href="/claver/apps"
                onClick={() => setNavOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  navDark ? "text-emerald-300 hover:bg-white/10" : "text-emerald-700 hover:bg-emerald-50",
                )}
              >
                Ver las 8 apps →
              </Link>
              {CLAVER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
                    navDark
                      ? "text-slate-200 hover:bg-white/10"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div
              className={cn(
                "mt-4 flex flex-col gap-2 border-t pt-4",
                navDark ? "border-white/10" : "border-slate-200",
              )}
            >
              <Button
                variant="outline"
                className={navDark ? "border-white/20 text-slate-200" : ""}
                asChild
              >
                <Link href="/login" onClick={() => setNavOpen(false)}>
                  Iniciar sesión
                </Link>
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-500" asChild>
                <Link href="/login/register?trial=14" onClick={() => setNavOpen(false)}>
                  Probar gratis 14 días
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-12 text-slate-400 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <BrandLogo size="md" theme="dark" variant="group-full" />
            <p className="max-w-sm text-sm">
              {CLAVER_GROUP.descriptor}. Claver para comercio, Clavergrow para producción agrícola.
            </p>
            <div className="flex flex-wrap gap-4">
              <BrandLogo size="sm" theme="dark" variant="claverp-full" />
              <BrandLogo size="sm" theme="dark" variant="clavergrow-full" />
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Productos</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/claver/apps" className="hover:text-white">Apps para vender hoy</Link></li>
              <li><Link href="/claver/claverp" className="hover:text-white">Claver — ERP & POS</Link></li>
              <li><Link href="/claver/claverp/modulos" className="hover:text-white">Módulos Claver</Link></li>
              <li><Link href="/claver/claverp/precios" className="hover:text-white">Precios Claver</Link></li>
              <li><Link href="/claver/clavergrow" className="hover:text-white">Clavergrow — Agro</Link></li>
              <li><Link href="/demo" className="hover:text-white">Demos por rubro</Link></li>
              <li><Link href="/claver/ecommerce" className="hover:text-white">Ecommerce</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Claver</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white">Inicio</Link></li>
              <li><Link href="/login/register?trial=14" className="hover:text-white">Registro gratis</Link></li>
              <li><Link href="/claver/contacto" className="hover:text-white">Contacto / ventas</Link></li>
              <li><Link href="/claver-cloud" className="hover:text-white">Claver Cloud</Link></li>
              <li><Link href="/claver/marca" className="hover:text-white">Identidad</Link></li>
              <li><Link href="/login" className="hover:text-white">Iniciar sesión</Link></li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {CLAVER_GROUP.name} · Claver · Clavergrow. Argentina.
        </p>
      </footer>
    </div>
  )
}

/** @deprecated Usar ClaverShell */
export const MarketingShell = ClaverShell