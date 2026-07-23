"use client"

import { useEffect, useState } from "react"
import { Search, Menu, X, GraduationCap, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DocClientProps {
  sidebarItems: {
    category: string
    items: {
      slug: string
      title: string
      audience: string
    }[]
  }[]
  currentSlug: string
}

const AUDIENCE_HINT: Record<string, string> = {
  all: "Todos",
  developer: "Dev",
  analista: "Implementación",
  operaciones: "Ops",
  comercial: "Comercial",
  ia: "IA",
  partner: "Partner",
}

export default function DocClient({ sidebarItems, currentSlug }: DocClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const initMermaid = async () => {
      try {
        const mermaid = (await import("mermaid")).default
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "Manrope, system-ui, sans-serif",
          flowchart: { curve: "basis", padding: 12 },
          themeVariables: {
            primaryColor: "oklch(0.7 0.12 250 / 0.25)",
            primaryTextColor: "#0f172a",
            primaryBorderColor: "oklch(0.55 0.14 250)",
            lineColor: "#64748b",
            secondaryColor: "oklch(0.92 0.03 250)",
            tertiaryColor: "#f8fafc",
            background: "transparent",
            mainBkg: "#f8fafc",
            nodeBorder: "#94a3b8",
            clusterBkg: "oklch(0.96 0.02 250)",
            titleColor: "#0f172a",
            edgeLabelBackground: "#ffffff",
          },
        })
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        if (cancelled) return
        // Reset processed flag so re-navigation re-renders
        document.querySelectorAll<HTMLElement>("pre.mermaid").forEach((el) => {
          el.removeAttribute("data-processed")
          if (el.getAttribute("data-original")) {
            el.textContent = el.getAttribute("data-original")
          } else {
            el.setAttribute("data-original", el.textContent || "")
          }
        })
        const nodes = document.querySelectorAll<HTMLElement>("pre.mermaid")
        if (nodes.length > 0) {
          await mermaid.run({ nodes })
        }
      } catch (err) {
        console.error("Error al inicializar Mermaid:", err)
      }
    }

    void initMermaid()
    return () => {
      cancelled = true
    }
  }, [currentSlug])

  const q = searchQuery.trim().toLowerCase()
  const filteredSidebar = sidebarItems
    .map((category) => {
      const matched = category.items.filter(
        (item) =>
          !q ||
          item.title.toLowerCase().includes(q) ||
          category.category.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q),
      )
      return { ...category, items: matched }
    })
    .filter((category) => category.items.length > 0)

  const NavTree = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-4">
      <Link
        href="/dashboard/documentacion"
        onClick={onNavigate}
        className={cn(
          "text-sm rounded-lg px-2.5 py-2 transition-colors",
          currentSlug === "index"
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        Inicio · Claver Docs
      </Link>
      {filteredSidebar.map((cat) => (
        <div key={cat.category} className="space-y-1">
          <h3 className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
            {cat.category}
          </h3>
          <div className="flex flex-col gap-0.5">
            {cat.items.map((item) => (
              <Link
                key={item.slug}
                href={`/dashboard/documentacion/${item.slug}`}
                onClick={onNavigate}
                className={cn(
                  "group flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  currentSlug === item.slug
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span className="leading-snug">{item.title}</span>
                {item.audience && item.audience !== "all" && (
                  <span
                    className={cn(
                      "shrink-0 text-[10px] rounded-md px-1.5 py-0.5 mt-0.5",
                      currentSlug === item.slug
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {AUDIENCE_HINT[item.audience] ?? item.audience}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
      {q && filteredSidebar.length === 0 && (
        <p className="text-sm text-muted-foreground px-2.5 py-4">
          No encontramos “{searchQuery}”. Probá “fiado”, “caja” o “leo”.
        </p>
      )}
    </nav>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar: fiado, caja, AFIP…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 w-full bg-background border-border/70 shadow-sm rounded-xl"
          aria-label="Buscar en Claver Docs"
        />
      </div>

      <Link
        href="/dashboard/capacitacion/manual-usuario"
        className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 flex items-center gap-3 hover:bg-primary/10 transition-colors"
      >
        <GraduationCap className="h-5 w-5 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">¿Sos cajero o dueño?</p>
          <p className="text-xs text-muted-foreground">Manual paso a paso del día a día</p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
      </Link>

      <div className="md:hidden flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Índice
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="ml-1.5">{mobileMenuOpen ? "Cerrar" : "Menú"}</span>
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border rounded-xl p-3 bg-card max-h-[50vh] overflow-y-auto shadow-sm">
          <NavTree onNavigate={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="hidden md:block overflow-y-auto max-h-[calc(100vh-16rem)] pr-1 pb-8">
        <NavTree />
      </div>
    </div>
  )
}
