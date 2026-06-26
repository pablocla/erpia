"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Cloud } from "lucide-react"
import { cn } from "@/lib/utils"

const LABELS: Record<string, string> = {
  "claver-cloud": "Inicio",
  superadmin: "Super Admin",
  organizations: "Organizaciones",
  tenants: "Organización",
  operations: "Operaciones",
  implementation: "Implementación",
  marketplace: "Marketplace",
  billing: "Facturación",
  provisioning: "Provisioning",
  new: "Nuevo tenant",
  settings: "Configuración",
  assignments: "Asignaciones",
  reports: "Reportes",
}

function segmentLabel(seg: string, index: number, segments: string[]) {
  if (LABELS[seg]) return LABELS[seg]
  if (/^\d+$/.test(seg)) {
    const prev = segments[index - 1]
    if (prev === "tenants") return `Tenant #${seg}`
    if (prev === "operations") return `Ops #${seg}`
    if (prev === "implementation") return `Proyecto #${seg}`
  }
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ")
}

export function CloudBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  if (!pathname?.startsWith("/claver-cloud") || pathname === "/claver-cloud") return null

  const segments = pathname.split("/").filter(Boolean)
  const crumbs = segments.map((seg, i) => ({
    label: segmentLabel(seg, i, segments),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }))

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-muted-foreground flex-wrap", className)}
    >
      <Link
        href="/claver-cloud"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Cloud className="h-3.5 w-3.5 text-violet-400" />
        <span className="hidden sm:inline">Claver Cloud</span>
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3 w-3 shrink-0" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}