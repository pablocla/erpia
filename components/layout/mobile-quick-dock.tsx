"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, Wallet, Users, Megaphone, Bot, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/lib/stores/ui-store"

interface DockItem {
  href: string
  label: string
  icon: React.ElementType
}

const DOCK_ITEMS: DockItem[] = [
  { href: "/dashboard/pos", label: "POS Mostrador", icon: Store },
  { href: "/dashboard/fiado", label: "Fiado & Cobro", icon: Wallet },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/empleados-digitales", label: "Leo AI", icon: Bot },
]

export function MobileQuickDock() {
  const pathname = usePathname()
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border/80 px-4 py-2 flex items-center justify-around shadow-lg">
      {DOCK_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[56px] py-1 px-2 rounded-xl transition-all touch-target text-xs font-medium",
              isActive
                ? "text-primary bg-primary/10 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] leading-none">{item.label}</span>
          </Link>
        )
      })}

      <button
        onClick={() => toggleCommandPalette()}
        className="flex flex-col items-center gap-1 min-w-[56px] py-1 px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all touch-target text-xs font-medium"
      >
        <Search className="h-5 w-5 shrink-0" />
        <span className="text-[10px] leading-none">Buscar</span>
      </button>
    </div>
  )
}
