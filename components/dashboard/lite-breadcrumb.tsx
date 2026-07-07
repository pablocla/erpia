"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { getActiveProductShell } from "@/lib/comercial/product-shell"
import { cn } from "@/lib/utils"

const SEGMENT_LABELS: Record<string, string> = {
  agenda: "Agenda",
  fiado: "Libreta",
  "cuentas-cobrar": "Cobros",
  "ventas": "Ventas",
  presupuestos: "Presupuestos",
  nicho: "Nicho",
  consorcios: "Consorcios",
  obras: "Obra",
  clientes: "Clientes",
  "mi-plan": "Mi plan",
}

interface LiteBreadcrumbProps {
  modoLite: string
  productosSku?: Record<string, boolean> | null
  className?: string
}

export function LiteBreadcrumb({ modoLite, productosSku, className }: LiteBreadcrumbProps) {
  const pathname = usePathname()
  const shell = getActiveProductShell(modoLite, productosSku ?? null)
  if (!shell || modoLite === "completo") return null

  const segments = pathname.split("/").filter(Boolean)
  const moduleSeg = segments[1] === "dashboard" ? segments[2] : segments[0]
  const subSeg = segments[1] === "dashboard" ? segments[3] : segments[1]
  const moduleLabel = SEGMENT_LABELS[moduleSeg ?? ""] ?? shell.tabs[0]?.label ?? "Inicio"
  const subLabel = subSeg ? SEGMENT_LABELS[subSeg] : null
  const homeHref = shell.tabs[0]?.href ?? "/dashboard"

  return (
    <nav
      aria-label="Ubicación"
      className={cn("flex items-center gap-1 text-xs text-muted-foreground min-w-0", className)}
    >
      <Link href={homeHref} className="inline-flex items-center gap-0.5 hover:text-foreground shrink-0">
        <Home className="h-3 w-3" aria-hidden />
        <span className="font-medium text-foreground truncate max-w-[6rem]">{shell.marca}</span>
      </Link>
      <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
      <span className="truncate">{moduleLabel}</span>
      {subLabel && subLabel !== moduleLabel && (
        <>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
          <span className="truncate">{subLabel}</span>
        </>
      )}
    </nav>
  )
}