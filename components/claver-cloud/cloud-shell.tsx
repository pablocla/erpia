"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  CreditCard,
  Home,
  Menu,
  PlusSquare,
  Search,
  Server,
  Settings,
  Shield,
  Target,
  Store,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Home", href: "/claver-cloud", icon: Home },
  { name: "Super Admin", href: "/claver-cloud/superadmin", icon: Shield },
  { name: "Tenants", href: "/claver-cloud/organizations", icon: Building2 },
  { name: "Provisioning", href: "/claver-cloud/provisioning", icon: PlusSquare },
  { name: "Operations", href: "/claver-cloud/operations", icon: Server },
  { name: "Implementation", href: "/claver-cloud/implementation", icon: Target },
  { name: "Marketplace", href: "/claver-cloud/marketplace", icon: Store },
  { name: "Billing", href: "/claver-cloud/billing", icon: CreditCard },
  { name: "Settings", href: "/claver-cloud/settings", icon: Settings },
]

export function CloudShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground dark">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mt-0 sm:mt-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs dark">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/claver-cloud"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Server className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">Claver Cloud</span>
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-2.5",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        
        {/* Breadcrumbs or Title could go here on larger screens */}
        <div className="flex-1 sm:hidden" />
        
        {/* Global Search */}
        <div className="relative ml-auto flex-1 md:grow-0 w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tenant by ID, CUIT or Name..."
            className="w-full rounded-lg bg-background pl-8 md:w-[300px] lg:w-[400px]"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden sm:flex w-64 flex-col border-r bg-background">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/claver-cloud" className="flex items-center gap-2 font-semibold">
              <Server className="h-5 w-5" />
              <span className="">Claver Cloud</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    pathname.startsWith(item.href) && item.href !== "/claver-cloud" || (pathname === "/claver-cloud" && item.href === "/claver-cloud")
                      ? "bg-muted text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
