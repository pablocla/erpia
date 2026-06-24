"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/marketing/brand-logo"

const NAV_LINKS = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#precios", label: "Precios" },
  { href: "#integraciones", label: "Integraciones" },
  { href: "#faq", label: "FAQ" },
  { href: "/claver/claverp", label: "Clavis" },
]

export function EcommerceNav() {
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/ecommerce">
          <BrandLogo size="sm" theme={scrolled ? "light" : "light"} variant="claverp-full" />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tienda?empresaId=1">Ver demo tienda</Link>
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white" asChild>
            <Link href="/login">
              Probar gratis
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-900 lg:hidden"
          onClick={() => setNavOpen((v) => !v)}
          aria-label="Menú"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {navOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNavOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <Button className="mt-2 bg-amber-600 hover:bg-amber-500" asChild>
              <Link href="/login">Probar gratis</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
