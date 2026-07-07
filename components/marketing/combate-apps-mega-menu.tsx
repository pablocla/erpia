"use client"

import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { COMBATE_APPS } from "@/lib/comercial/go-to-market-vitrine"
import { subSaasLandingHref } from "@/lib/comercial/sub-saas-catalog"
import { ChevronDown, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface CombateAppsMegaMenuProps {
  className?: string
  triggerClassName?: string
  dark?: boolean
}

export function CombateAppsMegaMenu({ className, triggerClassName, dark }: CombateAppsMegaMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          dark
            ? "text-slate-300 hover:bg-white/10 hover:text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          triggerClassName,
        )}
      >
        <LayoutGrid className="h-4 w-4 opacity-70" aria-hidden />
        Apps combate
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className={cn("w-64", className)}>
        <DropdownMenuLabel>8 productos para vender hoy</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COMBATE_APPS.map((app) => (
          <DropdownMenuItem key={app.slug} asChild>
            <Link href={subSaasLandingHref(app.slug)} className="flex flex-col items-start gap-0.5">
              <span className="font-medium">{app.marca}</span>
              <span className="text-[10px] text-muted-foreground line-clamp-1">{app.lema}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/claver/apps" className="text-xs text-primary font-medium">
            Ver catálogo completo →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}