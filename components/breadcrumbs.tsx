"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const LABELS: Record<string, string> = {
  dashboard: "Inicio",
  clientes: "Clientes",
  proveedores: "Proveedores",
  productos: "Productos",
  movimientos: "Movimientos",
  ventas: "Ventas",
  presupuestos: "Presupuestos",
  compras: "Compras",
  facturas: "Facturas",
  remitos: "Remitos",
  "notas-credito": "Notas de Crédito",
  "notas-debito": "Notas de Débito",
  caja: "Caja",
  banco: "Banco",
  cheques: "Cheques",
  contabilidad: "Contabilidad",
  "activos-fijos": "Activos Fijos",
  "centros-costo": "Centros de Costo",
  inflacion: "Ajuste por Inflación",
  impuestos: "Impuestos",
  iibb: "IIBB",
  tes: "TES",
  padron: "Padrón",
  "cuentas-cobrar": "Cuentas a Cobrar",
  "cuentas-pagar": "Cuentas a Pagar",
  empleados: "Empleados",
  usuarios: "Usuarios",
  configuracion: "Configuración",
  auditoria: "Auditoría",
  cotizaciones: "Cotizaciones",
  tablas: "Tablas",
  hospitalidad: "Hospitalidad",
  platos: "Platos",
  mesas: "Mesas",
  kds: "Cocina (KDS)",
  logistica: "Logística",
  industria: "Industria",
  picking: "Picking",
  iot: "IoT",
  membresias: "Membresías",
  agenda: "Agenda",
  "historia-clinica": "Historia Clínica",
  veterinaria: "Veterinaria",
  cashflow: "Cashflow",
  distribucion: "Distribución",
  calidad: "Calidad",
  mrp: "MRP",
  presupuesto: "Presupuesto",
  kpis: "KPIs",
  series: "Series",
  "puntos-venta": "Puntos de Venta",
  agentes: "Agentes IA",
  capacitacion: "Capacitación",
  parametrizacion: "Parametrización",
  diagnostico: "Diagnóstico",
  onboarding: "Onboarding",
  portal: "Portal B2B",
  tienda: "Tienda",
  vendedor: "Vendedor en Ruta",
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  if (!pathname || pathname === "/dashboard") return null

  const segments = pathname.split("/").filter(Boolean)
  // Only render within /dashboard/...
  if (segments[0] !== "dashboard" || segments.length < 2) return null

  const crumbs = segments.map((seg, i) => ({
    label: LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }))

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
