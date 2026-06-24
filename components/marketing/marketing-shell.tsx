"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MARKETING_NAV } from "@/lib/marketing/brand-system"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"

interface MarketingShellProps {
  children: React.ReactNode
  theme?: "dark-hero" | "light"
}

export function MarketingShell({ children, theme = "dark-hero" }: MarketingShellProps) {
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navDark = theme === "dark-hero" || scrolled

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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/marketing">
            <BrandLogo size="sm" theme={navDark ? "dark" : "light"} />
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex">
            {MARKETING_NAV.slice(1, 8).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-xs font-medium transition",
                  navDark
                    ? "text-slate-300 hover:bg-white/10 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="ghost"
              size="sm"
              className={navDark ? "text-slate-300 hover:text-white" : ""}
              asChild
            >
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500" asChild>
              <Link href="/login">
                Demo
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <button
            type="button"
            className={cn("rounded-lg p-2 xl:hidden", navDark ? "text-white" : "text-slate-900")}
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Menú"
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {navOpen && (
          <div className="border-t border-white/10 bg-slate-950 px-4 py-4 xl:hidden">
            <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
              {MARKETING_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
              <Button className="mt-2" asChild>
                <Link href="/login">Probar demo</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-12 text-slate-400 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo size="md" theme="dark" />
            <p className="mt-4 max-w-sm text-sm">
              Departamento de Marketing — paquete de landings verticales, identidad NexoOS y roadmap
              comercial Q2–Q4 2026.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Soluciones</p>
            <ul className="space-y-2 text-sm">
              {MARKETING_NAV.slice(1, 8).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Empresa</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/marketing/precios" className="hover:text-white">Precios</Link></li>
              <li><Link href="/marketing/marca" className="hover:text-white">Marca</Link></li>
              <li><Link href="/modulos" className="hover:text-white">Catálogo módulos</Link></li>
              <li><Link href="/login" className="hover:text-white">Demo</Link></li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Claver · Clavis. Precios orientativos + IVA.
        </p>
      </footer>
    </div>
  )
}