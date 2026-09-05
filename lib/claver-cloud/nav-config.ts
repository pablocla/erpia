import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  BookOpen,
  Building2,
  CreditCard,
  CalendarClock,
  ClipboardList,
  Map,
  LayoutDashboard,
  Megaphone,
  Network,
  PlusSquare,
  Rocket,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Store,
  Target,
  UserPlus,
  Users,
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
    label: "negocio",
    items: [
      { name: "commandCenter", href: "/claver-cloud", icon: LayoutDashboard, exact: true },
      { name: "analytics", href: "/claver-cloud/analytics", icon: BarChart3 },
      { name: "webRegistrations", href: "/claver-cloud/registros", icon: UserPlus },
      { name: "salesPipeline", href: "/claver-cloud/comercial", icon: Target,
        matchPrefixes: ["/claver-cloud/comercial/upgrades-arca", "/claver-cloud/comercial/relevamientos", "/claver-cloud/comercial/campo"],
      },
      { name: "billing", href: "/claver-cloud/billing", icon: CreditCard },
      { name: "partnersPayouts", href: "/claver-cloud/partners", icon: Users },
    ],
  },
  {
    label: "platform",
    items: [
      {
        name: "fleet",
        href: "/claver-cloud/tenants",
        icon: Building2,
        matchPrefixes: ["/claver-cloud/operations", "/claver-cloud/organizations", "/claver-cloud/superadmin"],
      },
      { name: "provisioning", href: "/claver-cloud/provisioning", icon: PlusSquare },
      { name: "goLive", href: "/claver-cloud/go-live", icon: Rocket,
        matchPrefixes: ["/claver-cloud/implementation"],
      },
      { name: "marketplace", href: "/claver-cloud/marketplace", icon: Store },
      { name: "platformHealth", href: "/claver-cloud/platform-health", icon: Shield,
        matchPrefixes: ["/claver-cloud/demo-health"],
      },
    ],
  },
  {
    label: "integraciones",
    items: [
      { name: "setupProtheus", href: "/claver-cloud/protheus-setup", icon: Wrench },
      { name: "opoConsole", href: "/claver-cloud/opo-console", icon: Network,
        matchPrefixes: ["/claver-cloud/protheus-api"],
      },
    ],
  },
  {
    label: "admin",
    items: [
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