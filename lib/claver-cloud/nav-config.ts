import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Building2,
  CreditCard,
  ClipboardList,
  Map,
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
    label: "ceo",
    items: [
      { name: "commandCenter", href: "/claver-cloud", icon: LayoutDashboard, exact: true },
      { name: "salesPipeline", href: "/claver-cloud/comercial", icon: Target },
      { name: "fieldSurvey", href: "/claver-cloud/comercial/relevamientos", icon: ClipboardList },
      { name: "mapAndRoute", href: "/claver-cloud/comercial/campo", icon: Map },
    ],
  },
  {
    label: "platform",
    items: [
      { name: "superAdmin", href: "/claver-cloud/superadmin", icon: Shield },
      {
        name: "tenants",
        href: "/claver-cloud/organizations",
        icon: Building2,
        matchPrefixes: ["/claver-cloud/tenants"],
      },
      { name: "provisioning", href: "/claver-cloud/provisioning", icon: PlusSquare },
      { name: "operations", href: "/claver-cloud/operations", icon: Server },
      { name: "implementation", href: "/claver-cloud/implementation", icon: Target },
      { name: "marketplace", href: "/claver-cloud/marketplace", icon: Store },
    ],
  },
  {
    label: "protheus",
    items: [
      { name: "setupProtheus", href: "/claver-cloud/protheus-setup", icon: Wrench },
      { name: "opoConsole", href: "/claver-cloud/opo-console", icon: Network },
      { name: "restApi", href: "/claver-cloud/protheus-api", icon: BookOpen },
    ],
  },
  {
    label: "admin",
    items: [
      { name: "billing", href: "/claver-cloud/billing", icon: CreditCard },
      { name: "settings", href: "/claver-cloud/settings", icon: Settings },
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