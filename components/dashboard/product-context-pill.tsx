"use client"

import Link from "next/link"
import { ChevronDown, LayoutGrid } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getActiveProductShell, productShellHomePath } from "@/lib/comercial/product-shell"
import { COMBATE_APPS } from "@/lib/comercial/go-to-market-vitrine"
import { subSaasLandingHref } from "@/lib/comercial/sub-saas-catalog"
import { cn } from "@/lib/utils"

interface ProductContextPillProps {
  modoLite?: string
  productosSku?: Record<string, boolean> | null
  className?: string
}

const APPS_HREF = "/dashboard/apps"
const MI_PLAN_HREF = "/dashboard/mi-plan"

export function ProductContextPill({
  modoLite = "completo",
  productosSku = null,
  className,
}: ProductContextPillProps) {
  const shell = getActiveProductShell(modoLite, productosSku)
  if (!shell || modoLite === "completo") return null

  const Icon = shell.icono
  const homeHref = productShellHomePath(shell)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/12 max-w-[11rem]",
          className,
        )}
      >
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">{shell.marca}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={homeHref}>Ir a {shell.tabs[0]?.label ?? "Inicio"}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={MI_PLAN_HREF}>Mi plan y módulos</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={APPS_HREF} className="flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            Más apps Claver
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Otros productos
        </p>
        {COMBATE_APPS.filter((a) => a.slug !== shell.slug).slice(0, 5).map((app) => (
          <DropdownMenuItem key={app.slug} asChild>
            <Link href={subSaasLandingHref(app.slug)} className="text-xs">
              {app.nombre}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/claver/apps" className="text-xs text-muted-foreground">
            Ver catálogo completo
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}