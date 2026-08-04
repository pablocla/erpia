"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, Users, PlusCircle } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"

export function MobileBottomNav() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isPrestamista = user?.empresaModoLite === "prestamista" || pathname.startsWith("/dashboard/prestamos")

  if (!isPrestamista) return null

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/dashboard/prestamos/cobranza", icon: Wallet, label: "Cobrar hoy" },
    { href: "/dashboard/prestamos", icon: PlusCircle, label: "Nuevo", highlight: true },
    { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border px-2 py-2 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        if (item.highlight) {
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-5">
              <div className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all border-4 border-background">
                <Icon className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-1">{item.label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              isActive ? "text-primary font-extrabold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`h-6 w-6 ${isActive ? "scale-110 text-primary" : ""}`} />
            <span className="text-[11px] mt-0.5">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}