import type { ElementType } from "react"
import type { Rubro } from "@/lib/onboarding/onboarding-ia"
import {
  ShoppingCart,
  Receipt,
  Wallet,
  FileText,
  BookOpen,
  Settings,
  Users,
  Building2,
  CreditCard,
  Landmark,
  FilePlus,
  Shield,
  Database,
  Bug,
  Wrench,
  Plus,
  Gift,
  Cloud,
  FileSpreadsheet,
  Store,
  Truck,
  Clock,
  Package,
  CalendarDays,
  FileCheck,
  Gamepad2,
  Bot,
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
    label: "Operación del día",
    color: "text-emerald-500",
    moduloKey: "ventas",
    items: [
      { href: "/dashboard/pos", icon: Store, label: "Punto de Venta (POS)", badge: "Caja" },
      { href: "/dashboard/ventas", icon: Receipt, label: "Facturación AFIP", badge: "Extra" },
      { href: "/dashboard/facturas", icon: FileText, label: "Historial de Facturas" },
      { href: "/dashboard/notas-credito", icon: FileCheck, label: "Notas de Crédito / Débito" },
      { href: "/dashboard/ventas/presupuestos", icon: FilePlus, label: "Presupuestos Comerciales" },
      { href: "/dashboard/fiado", icon: BookOpen, label: "Libreta de Fiado" },
      { href: "/dashboard/productos", icon: Package, label: "Productos & Stock" },
      { href: "/dashboard/clientes", icon: Users, label: "Clientes & Directorio" },
      { href: "/dashboard/agenda", icon: CalendarDays, label: "Agenda de Turnos" },
    ],
  },
  {
    label: "Caja & Finanzas",
    color: "text-violet-500",
    moduloKey: "caja",
    items: [
      { href: "/dashboard/caja", icon: Wallet, label: "Caja y Arqueo" },
      { href: "/dashboard/banco", icon: Landmark, label: "Bancos & Cuentas" },
      { href: "/dashboard/mercadopago", icon: CreditCard, label: "Mercado Pago", badge: "Extra" },
      { href: "/dashboard/cuentas-cobrar", icon: FilePlus, label: "Cuentas a Cobrar (CxC)" },
      { href: "/dashboard/cuentas-pagar", icon: FileText, label: "Cuentas a Pagar (CxP)" },
      { href: "/dashboard/compras", icon: ShoppingCart, label: "Facturas de Compra" },
      { href: "/dashboard/proveedores", icon: Building2, label: "Proveedores & Compras" },
    ],
  },
  {
    label: "Impuestos & AFIP",
    color: "text-red-500",
    items: [
      { href: "/dashboard/impuestos", icon: FileText, label: "IVA & Libros Fiscales", badge: "Extra" },
      { href: "/dashboard/impuestos/padron", icon: Database, label: "Padrón ARBA / AGIP", badge: "Extra" },
      { href: "/dashboard/impuestos/iibb", icon: FileSpreadsheet, label: "Convenio SIFERE CM03", badge: "Extra" },
    ],
  },
  {
    label: "Oficios & Obras",
    color: "text-amber-500",
    moduloKey: "oficios",
    items: [
      { href: "/dashboard/oficios", icon: Wrench, label: "Trabajos & Obras", skuKey: "niche.oficios" },
      { href: "/dashboard/oficios/nuevo", icon: Plus, label: "Nuevo Presupuesto de Obra", badge: "3 Niv", skuKey: "niche.oficios" },
      { href: "/dashboard/oficios/cuadrilla", icon: Users, label: "Cuadrilla & Jornales", skuKey: "niche.oficios" },
      { href: "/dashboard/oficios/alquileres", icon: Truck, label: "Alquiler Maquinaria", skuKey: "niche.oficios" },
      { href: "/dashboard/oficios/services", icon: Clock, label: "Services & Mantenimiento", skuKey: "niche.oficios" },
      { href: "/dashboard/afiliados", icon: Gift, label: "Mi Red & Ganancias", badge: "25%", skuKey: "niche.oficios" },
    ],
  },
  {
    label: "IA & Cuadrilla Digital",
    color: "text-cyan-400",
    items: [
      { href: "/campus", icon: Gamepad2, label: "Campus 2D (Oficina Pixel)", badge: "Juego" },
      { href: "/claver/agent-city/app", icon: Bot, label: "Agent City (Torre de Control)", badge: "Lab" },
      { href: "/dashboard/empleados-digitales", icon: Users, label: "Empleados Digitales", badge: "Jobs" },
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
