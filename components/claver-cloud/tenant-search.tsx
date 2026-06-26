"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"

type TenantHit = {
  id: number
  nombre: string
  razonSocial: string
  cuit?: string | null
  rubro: string
}

export function TenantSearch({ className }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TenantHit[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const buscar = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: trimmed, take: "8" })
      const res = await fetch(`/api/claver/ops/clientes?${params}`, { headers: cloudAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        const hits = (data.data ?? []) as TenantHit[]
        setResults(hits)
        setOpen(hits.length > 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => void buscar(query), 280)
    return () => clearTimeout(t)
  }, [query, buscar])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function irATenant(hit: TenantHit) {
    setOpen(false)
    setQuery("")
    router.push(`/claver-cloud/tenants/${hit.id}`)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      {loading && (
        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            e.preventDefault()
            irATenant(results[0])
          }
          if (e.key === "Escape") setOpen(false)
        }}
        placeholder="Buscar organización por nombre, CUIT o ID…"
        className="w-full rounded-lg bg-background pl-8 pr-8 md:w-[280px] lg:w-[360px]"
        aria-label="Buscar tenant"
        aria-expanded={open}
        role="combobox"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full min-w-[280px] rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden">
          <ul className="max-h-64 overflow-y-auto py-1">
            {results.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/80 transition-colors"
                  onClick={() => irATenant(hit)}
                >
                  <Building2 className="h-4 w-4 mt-0.5 text-violet-400 shrink-0" />
                  <span className="min-w-0">
                    <span className="font-medium block truncate">{hit.nombre}</span>
                    <span className="text-xs text-muted-foreground block truncate">
                      #{hit.id} · {hit.cuit ?? hit.razonSocial} · {hit.rubro}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}