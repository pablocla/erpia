"use client"

import { useEffect, useState } from "react"
import { Search, Menu, X, BookOpen, GraduationCap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

export default function DocClient({ sidebarItems, currentSlug }: DocClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Lazy load and initialize Mermaid
    const initMermaid = async () => {
      try {
        const mermaid = (await import("mermaid")).default
        mermaid.initialize({
          startOnLoad: true,
          theme: "dark",
          securityLevel: "loose",
        })
        mermaid.contentLoaded()
      } catch (err) {
        console.error("Error al inicializar Mermaid:", err)
      }
    }

    initMermaid()
  }, [currentSlug])

  // Filter sidebar items based on search query
  const filteredSidebar = sidebarItems.map(category => {
    const matched = category.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return {
      ...category,
      items: matched
    }
  }).filter(category => category.items.length > 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="relative w-full max-w-sm mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar en la documentación..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-9 w-full bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
        />
      </div>

      {/* Cross-link to Capacitación */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-primary shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">¿Buscas manuales de usuario?</p>
            <p className="text-muted-foreground">Flujos interactivos de negocio y operación diaria.</p>
          </div>
        </div>
        <Link href="/dashboard/capacitacion/manual-usuario" className="shrink-0">
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-primary">
            Manual de Usuario <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Sidebar List (Mobile Drawer / Toggle) */}
      <div className="md:hidden flex justify-between items-center bg-muted/30 p-2 rounded-lg">
        <span className="text-xs font-semibold text-muted-foreground">Documentos</span>
        <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border rounded-lg p-3 bg-card space-y-4">
          {filteredSidebar.map(cat => (
            <div key={cat.category} className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cat.category}</h3>
              <div className="flex flex-col gap-1 pl-2">
                {cat.items.map(item => (
                  <Link
                    key={item.slug}
                    href={`/dashboard/documentacion/${item.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-xs py-1 rounded transition-colors ${
                      currentSlug === item.slug ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
