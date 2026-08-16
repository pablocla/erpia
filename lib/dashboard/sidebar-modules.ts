import type { ElementType } from "react"
import type { Rubro } from "@/lib/onboarding/onboarding-ia"
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Wallet,
  FileText,
  BookOpen,
  Settings,
  Users,
  Building2,
  BarChart3,
  CreditCard,
  Landmark,
  FilePlus,
  Shield,
  Database,
  Bug,
  Sparkles,
  Wrench,
  DollarSign,
  Plus,
  Gift,
  Cloud,
  FileSpreadsheet,
  Store,
  Truck,
} from "lucide-react"

export interface DashboardMenuItem {
  href?: string
  icon: ElementType
  label: string
  translationKey?: any
  badge?: string
  children?: DashboardMenuItem[]
  featureKey?: string
  permisoModulo?: string
  allowedRoles?: string[]
  excludedRoles?: string[]
  allowedUsers?: string[]
  allowedRubros?: Rubro[]
  claverAnalystOnly?: boolean
  skuKey?: string
  requiredCountryFeature?: string
  goLiveTier?: "prd" | "piloto" | "demo" | "no_vender"
}

export interface DashboardModuloSection {
  label: string
  translationKey?: any
  color: string
  moduloKey?: string
  requiredCountryFeature?: string
  items: DashboardMenuItem[]
}

export const DASHBOARD_SIDEBAR_MODULOS: DashboardModuloSection[] = [
  {
    label: "Oficios & Obras",
    color: "text-emerald-500",
    items: [
      { href: "/dashboard/oficios", icon: Wrench, label: "Trabajos & Obras", badge: "Principal" },
      { href: "/dashboard/oficios/nuevo", icon: Plus, label: "Nuevo Presupuesto (3 Niv)", badge: "IA" },
      { href: "/dashboard/oficios/cuadrilla", icon: Users, label: "Cuadrilla & Jornales" },
      { href: "/dashboard/oficios/alquileres", icon: Truck, label: "Alquiler Maquinaria" },
      { href: "/dashboard/oficios/services", icon: Clock, label: "Services & Alertas" },
      { href: "/dashboard/afiliados", icon: Gift, label: "Mi Red & Ganancias", badge: "25%" },
    ],
  },
  {
    label: "Ventas & Cobranzas",
    color: "text-green-500",
    moduloKey: "ventas",
    items: [
      { href: "/dashboard/ventas", icon: Receipt, label: "Facturación AFIP" },
      { href: "/dashboard/fiado", icon: BookOpen, label: "Libreta de Fiado" },
      { href: "/dashboard/cuentas-cobrar", icon: FilePlus, label: "Cuentas a Cobrar" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes & Directorio" },
    ],
  },
  {
    label: "Caja & Finanzas",
    color: "text-violet-500",
    moduloKey: "caja",
    items: [
      { href: "/dashboard/caja", icon: Wallet, label: "Caja Chica & Vales" },
      { href: "/dashboard/banco", icon: Landmark, label: "Bancos & Cuentas" },
      { href: "/dashboard/mercadopago", icon: CreditCard, label: "Mercado Pago Connect" },
      { href: "/dashboard/compras", icon: ShoppingCart, label: "Facturas de Compra" },
      { href: "/dashboard/proveedores", icon: Building2, label: "Proveedores & Corralón" },
    ],
  },
  {
    label: "Impuestos & AFIP",
    color: "text-red-500",
    items: [
      { href: "/dashboard/impuestos", icon: FileText, label: "IVA & Libros Fiscales" },
      { href: "/dashboard/impuestos/padron", icon: Database, label: "Padrón ARBA / AGIP" },
      { href: "/dashboard/impuestos/iibb", icon: FileSpreadsheet, label: "Convenio SIFERE CM03" },
    ],
  },
  {
    label: "Claver Cloud & Admin",
    color: "text-slate-400",
    items: [
      { href: "/claver-cloud", icon: Cloud, label: "Claver Cloud (Torre)", claverAnalystOnly: true, badge: "Master" },
      { href: "/dashboard/apps", icon: Store, label: "App Store & Módulos" },
      { href: "/dashboard/soporte", icon: Bug, label: "Soporte & Tickets" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Configuración Empresa" },
      { href: "/dashboard/usuarios", icon: Shield, label: "Usuarios & Permisos" },
    ],
  },
]
