"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList, LayoutDashboard, LogOut, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/claver-cliente", label: "Resumen", icon: LayoutDashboard },
  { href: "/claver-cliente/tickets", label: "Tickets", icon: Ticket },
  { href: "/claver-cliente/scrum", label: "Servicios", icon: ClipboardList },
]

export function ClientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    window.location.href = "/claver-cliente/login"
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-primary">Claver</span>
            <span className="text-muted-foreground text-sm font-normal">Seguimiento</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" />
            Salir
          </Button>
        </div>
      </header>
      <nav className="border-b">
        <div className="mx-auto flex max-w-5xl gap-1 px-4 py-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}