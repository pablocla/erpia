"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, Users, PlusCircle, ShoppingCart, CircleDollarSign, ReceiptText } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"

export function MobileBottomNav() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isPrestamista =
    user?.empresaModoLite === "prestamista" || pathname.startsWith("/dashboard/prestamos")

  if (isPrestamista) {
    const isLibreta =
      pathname === "/dashboard/prestamos" || pathname.startsWith("/dashboard/prestamos/pagares")
    const isHoy = pathname.startsWith("/dashboard/prestamos/cobranza")

    const navItems = [
      {
        href: "/dashboard",
        icon: Home,
        label: "Inicio",
        active: pathname === "/dashboard",
      },
      {
        href: "/dashboard/prestamos?tab=hoy",
        icon: Wallet,
        label: "Hoy",
        active: isHoy,
      },
      {
        href: "/dashboard/prestamos?nuevo=1",
        icon: PlusCircle,
        label: "Prestar",
        highlight: true as const,
        active: false,
      },
      {
        href: "/dashboard/prestamos",
        icon: Users,
        label: "Libreta",
        active: isLibreta,
      },
    ]

    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border px-2 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
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
                item.active ? "text-primary font-extrabold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 ${item.active ? "scale-110 text-primary" : ""}`} />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    )
  }

  // Standard retail / daily operations bottom nav
  const navItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Inicio",
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/pos",
      icon: ShoppingCart,
      label: "POS",
      active: pathname.startsWith("/dashboard/pos"),
    },
    {
      href: "/dashboard/ventas",
      icon: PlusCircle,
      label: "Venta",
      highlight: true as const,
      active: pathname === "/dashboard/ventas",
    },
    {
      href: "/dashboard/fiado",
      icon: ReceiptText,
      label: "Fiado",
      active: pathname.startsWith("/dashboard/fiado"),
    },
    {
      href: "/dashboard/caja",
      icon: CircleDollarSign,
      label: "Caja",
      active: pathname.startsWith("/dashboard/caja"),
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon

        if (item.highlight) {
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-4">
              <div className="h-13 w-13 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all border-4 border-background">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold text-primary mt-0.5">{item.label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              item.active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`h-5 w-5 ${item.active ? "scale-110 text-primary" : ""}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
