"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CLAVER_NAV, CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"

interface ClaverShellProps {
  children: React.ReactNode
  /** Matriz Claver o producto Clavis */
  context?: "matrix" | "claverp"
  theme?: "dark-hero" | "light"
}

export function ClaverShell({ children, context = "matrix", theme = "dark-hero" }: ClaverShellProps) {
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
          <Link href={context === "claverp" ? "/claver/claverp" : "/claver"}>
            <BrandLogo
              size="sm"
              theme={navDark ? "dark" : "light"}
              variant={context === "claverp" ? "claverp-full" : "group-full"}
            />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {CLAVER_NAV.map((item) => (
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
              <Link href="/claver">Grupo {CLAVER_GROUP.name}</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={
                navDark
                  ? "border-violet-400/40 text-violet-200 hover:bg-violet-500/15 hover:text-white"
                  : "border-violet-300 text-violet-700 hover:bg-violet-50"
              }
              asChild
            >
              <Link href="/claver-cloud">Claver Cloud</Link>
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500" asChild>
              <Link href="/login">
                Demo Clavis
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <button
            type="button"
            className={cn("rounded-lg p-2 lg:hidden", navDark ? "text-white" : "text-slate-900")}
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Menú"
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {navOpen && (
          <div className="border-t border-white/10 bg-slate-950 px-4 py-4 lg:hidden">
            <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
              {CLAVER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
              <Button variant="outline" className="mt-2 border-violet-400/40 text-violet-200" asChild>
                <Link href="/claver-cloud">Claver Cloud</Link>
              </Button>
              <Button className="mt-2" asChild>
                <Link href="/login">Demo Clavis</Link>
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
              {CLAVER_GROUP.descriptor}. Clavis es la línea ERP del grupo.
            </p>
            <BrandLogo size="sm" theme="dark" variant="claverp-full" />
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Clavis</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/claver/claverp" className="hover:text-white">Producto</Link></li>
              <li><Link href="/claver/claverp/modulos" className="hover:text-white">Módulos</Link></li>
              <li><Link href="/claver/claverp/precios" className="hover:text-white">Precios</Link></li>
              <li><Link href="/claver/claverp/ecommerce" className="hover:text-white">Ecommerce</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Claver</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/claver" className="hover:text-white">Matriz</Link></li>
              <li><Link href="/claver-cloud" className="hover:text-white">Claver Cloud</Link></li>
              <li><Link href="/claver/marca" className="hover:text-white">Identidad</Link></li>
              <li><Link href="/login" className="hover:text-white">Demo</Link></li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {CLAVER_GROUP.name} · Clavis. Argentina.
        </p>
      </footer>
    </div>
  )
}

/** @deprecated Usar ClaverShell */
export const MarketingShell = ClaverShell