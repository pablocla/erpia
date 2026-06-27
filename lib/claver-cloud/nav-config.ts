import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Building2,
  CreditCard,
  ClipboardList,
  LayoutDashboard,
  Network,
  PlusSquare,
  Server,
  Settings,
  Shield,
  Store,
  Target,
  Wrench,
} from "lucide-react"

export type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  /** Rutas hijas que deben resaltar este ítem (ej. tenants bajo organizations) */
  matchPrefixes?: string[]
  exact?: boolean
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: "CEO",
    items: [
      { name: "Centro de mando", href: "/claver-cloud", icon: LayoutDashboard, exact: true },
      { name: "Relevamiento calle", href: "/claver-cloud/comercial/relevamientos", icon: ClipboardList },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { name: "Super Admin", href: "/claver-cloud/superadmin", icon: Shield },
      {
        name: "Tenants",
        href: "/claver-cloud/organizations",
        icon: Building2,
        matchPrefixes: ["/claver-cloud/tenants"],
      },
      { name: "Provisioning", href: "/claver-cloud/provisioning", icon: PlusSquare },
      { name: "Operaciones", href: "/claver-cloud/operations", icon: Server },
      { name: "Implementación", href: "/claver-cloud/implementation", icon: Target },
      { name: "Marketplace", href: "/claver-cloud/marketplace", icon: Store },
    ],
  },
  {
    label: "Protheus / OPO",
    items: [
      { name: "Setup Protheus", href: "/claver-cloud/protheus-setup", icon: Wrench },
      { name: "Consola OPO", href: "/claver-cloud/opo-console", icon: Network },
      { name: "API REST", href: "/claver-cloud/protheus-api", icon: BookOpen },
    ],
  },
  {
    label: "Administración",
    items: [
      { name: "Facturación", href: "/claver-cloud/billing", icon: CreditCard },
      { name: "Configuración", href: "/claver-cloud/settings", icon: Settings },
    ],
  },
]

export const allNavItems = navSections.flatMap((s) => s.items)

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href
  }

  const prefixes = [item.href, ...(item.matchPrefixes ?? [])]
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}