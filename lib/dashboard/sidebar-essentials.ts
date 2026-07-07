import type { ElementType } from "react"
import {
  LayoutDashboard,
  Store,
  Wallet,
  Users,
  Package,
  FileText,
  Receipt,
  Truck,
  ScanLine,
  BarChart3,
} from "lucide-react"

export type SidebarEssential = {
  href: string
  label: string
  icon: ElementType
}

const BY_ROL: Record<string, SidebarEssential[]> = {
  cajero: [
    { href: "/dashboard/pos", icon: Store, label: "POS" },
    { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
    { href: "/dashboard/pos/cierre", icon: BarChart3, label: "Cierre" },
    { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
  ],
  deposito: [
    { href: "/dashboard/picking", icon: ScanLine, label: "Picking" },
    { href: "/dashboard/stock", icon: Truck, label: "Stock" },
    { href: "/dashboard/productos", icon: Package, label: "Productos" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  ],
  vendedor: [
    { href: "/dashboard/ventas", icon: Receipt, label: "Ventas" },
    { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
    { href: "/dashboard/pos", icon: Store, label: "POS" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  ],
  vendedor_ruta: [
    { href: "/dashboard/ventas", icon: Receipt, label: "Ventas" },
    { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  ],
  contador: [
    { href: "/dashboard/impuestos", icon: FileText, label: "Impuestos" },
    { href: "/dashboard/contabilidad", icon: BarChart3, label: "Contabilidad" },
    { href: "/dashboard/facturas", icon: FileText, label: "Facturas" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  ],
}

const DEFAULT: SidebarEssential[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/dashboard/pos", icon: Store, label: "POS" },
  { href: "/dashboard/ventas", icon: Receipt, label: "Ventas" },
  { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
  { href: "/dashboard/productos", icon: Package, label: "Productos" },
  { href: "/dashboard/caja", icon: Wallet, label: "Caja" },
  { href: "/dashboard/facturas", icon: FileText, label: "Facturas" },
]

export function getSidebarEssentials(rol?: string | null): SidebarEssential[] {
  if (!rol) return DEFAULT
  return BY_ROL[rol] ?? DEFAULT
}