import { type Rubro } from "@/lib/onboarding/onboarding-ia"
import { type ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { DollarSign, FileText, Package, Wallet, Users, CalendarDays, UtensilsCrossed, CheckSquare } from "lucide-react"

export type BuenDiaKpiId =
  | "ventas_hoy"
  | "tickets_hoy"
  | "stock_bajo"
  | "estado_caja"
  | "deuda_total"
  | "clientes_deuda"
  | "fiados_hoy"
  | "cxc_vencido"
  | "morosos"
  | "turnos_hoy"
  | "mesas_abiertas"

export interface BuenDiaKPI {
  id: BuenDiaKpiId
  label: string
  icon: any
  // Some format like "currency" | "number" | "boolean"
  format: "currency" | "number" | "text" | "boolean"
  fallbackLink?: string
}

export interface BuenDiaConfig {
  kpis: BuenDiaKPI[]
  // Additional configuration for empty states or specialized CTAs can go here
}

export function resolveBuenDiaConfig(modoLite: ModoLite, rubro: Rubro | "otro"): BuenDiaConfig {
  // 1. Modo Fiado
  if (modoLite === "fiado") {
    return {
      kpis: [
        { id: "deuda_total", label: "Deuda Total (Fiado)", icon: Wallet, format: "currency" },
        { id: "clientes_deuda", label: "Clientes con deuda", icon: Users, format: "number" },
        { id: "fiados_hoy", label: "Anotado hoy", icon: FileText, format: "currency" },
      ],
    }
  }

  // 2. Modo Cobranzas
  if (modoLite === "cobranza") {
    return {
      kpis: [
        { id: "cxc_vencido", label: "$ Vencido", icon: DollarSign, format: "currency" },
        { id: "morosos", label: "Clientes Morosos", icon: Users, format: "number" },
      ],
    }
  }

  // 3. Nichos Específicos
  if (rubro === "veterinaria" || rubro === "clinica" || rubro === "gimnasio" || rubro === "salon_belleza") {
    return {
      kpis: [
        { id: "turnos_hoy", label: "Turnos de hoy", icon: CalendarDays, format: "number", fallbackLink: "/dashboard/agenda" },
        { id: "ventas_hoy", label: "Ingresos hoy", icon: DollarSign, format: "currency" },
      ],
    }
  }

  if (rubro === "bar_restaurant") {
    return {
      kpis: [
        { id: "mesas_abiertas", label: "Mesas Abiertas", icon: UtensilsCrossed, format: "number", fallbackLink: "/dashboard/hospitalidad" },
        { id: "ventas_hoy", label: "Ventas hoy", icon: DollarSign, format: "currency" },
      ],
    }
  }

  // 4. Default: POS / Kiosco / Ferretería / Comercio General
  return {
    kpis: [
      { id: "ventas_hoy", label: "Ventas hoy", icon: DollarSign, format: "currency" },
      { id: "tickets_hoy", label: "Tickets hoy", icon: FileText, format: "number" },
      { id: "stock_bajo", label: "Stock Crítico", icon: Package, format: "number", fallbackLink: "/dashboard/productos" },
      { id: "estado_caja", label: "Estado Caja", icon: Wallet, format: "text", fallbackLink: "/dashboard/caja" },
    ],
  }
}
