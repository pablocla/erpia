"use client"

import Link from "next/link"
import { LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/stores/auth-store"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function SidebarUserCompact({ onLogout }: { onLogout: () => void }) {
  const user = useAuthStore((s) => s.user)
  const initial = (user?.nombre?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? "U").toUpperCase()
  const initials = user?.nombre ? getInitials(user.nombre) : initial

  return (
    <div className="p-2 border-t border-border/40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-full rounded-lg"
            aria-label={`Cuenta de ${user?.nombre ?? "usuario"}`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-semibold text-primary ring-1 ring-primary/15">
              {initials}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-52">
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user?.nombre ?? "Usuario"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? "—"}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracion" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            onSelect={(e) => {
              e.preventDefault()
              onLogout()
            }}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}