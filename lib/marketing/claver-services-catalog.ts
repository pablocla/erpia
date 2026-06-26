import type { LucideIcon } from "lucide-react"
import {
  Layers,
  CreditCard,
  Truck,
  Bot,
  Wrench,
  BarChart3,
  Network,
  Cloud,
} from "lucide-react"

export interface ClaverServiceLine {
  id: string
  name: string
  tagline: string
  description: string
  icon: LucideIcon
  gradient: string
  href?: string
  status: "disponible" | "proximamente" | "beta"
  features: string[]
}

/** Líneas de negocio del grupo Claver — Clavis es la flagship disponible */
export const CLAVER_SERVICE_LINES: ClaverServiceLine[] = [
  {
    id: "clavercloud",
    name: "Claver Cloud",
    tagline: "Torre SaaS multi-tenant",
    description:
      "Provisioning, marketplace de SKUs, implementación CCA y super admin. Cada empresa activa solo los servicios que necesita — de POS a logística, IA o bridge legacy.",
    icon: Cloud,
    gradient: "from-violet-600 to-indigo-900",
    href: "/claver-cloud",
    status: "disponible",
    features: ["Marketplace infinito de módulos", "Provisioning automático", "Torre de analistas", "Billing MRR"],
  },
  {
    id: "claverp",
    name: "Clavis",
    tagline: "ERP & POS con AFIP",
    description:
      "Sistema integral: ventas, stock, compras, caja, contabilidad, ecommerce, logística, industria y agro. 40+ módulos con onboarding por rubro.",
    icon: Layers,
    gradient: "from-blue-600 to-indigo-800",
    href: "/claver/claverp",
    status: "disponible",
    features: ["POS + factura electrónica", "Stock multi-depósito", "Portal B2B y tienda", "Onboarding IA"],
  },
  {
    id: "clavpay",
    name: "ClavPay",
    tagline: "Cobros y conciliación",
    description:
      "Mercado Pago, QR, tarjetas y conciliación automática con el ERP. Add-on nativo de Clavis, pronto como servicio standalone.",
    icon: CreditCard,
    gradient: "from-violet-600 to-purple-800",
    status: "beta",
    features: ["QR y link de pago", "Conciliación diaria", "Integrado a caja"],
  },
  {
    id: "clavlog",
    name: "ClavLog",
    tagline: "Logística y distribución",
    description:
      "Hojas de ruta, POD, app del vendedor y tracking. Para distribuidoras que necesitan el circuito completo.",
    icon: Truck,
    gradient: "from-emerald-600 to-teal-800",
    status: "proximamente",
    features: ["Rutas y paradas", "POD con geo", "App vendedor en ruta"],
  },
  {
    id: "clavbridge",
    name: "ClavBridge",
    tagline: "OPO sobre legacy",
    description:
      "Ontología Open Protocol sobre Protheus, SAP u Odoo. Clavis como frontend moderno sin reemplazar el ERP de golpe.",
    icon: Network,
    gradient: "from-slate-600 to-zinc-800",
    href: "/dashboard/apps/opo",
    status: "beta",
    features: ["Introspección REST/SQL", "Demo Protheus", "Playground OPOQL", "MCP para agentes IA"],
  },
  {
    id: "clavai",
    name: "ClavAI",
    tagline: "Inteligencia operativa",
    description:
      "Agentes IA, automatización n8n, Morning Commander y onboarding inteligente. Capa de IA sobre cualquier producto Claver.",
    icon: Bot,
    gradient: "from-fuchsia-600 to-pink-800",
    status: "beta",
    features: ["Asistente en el ERP", "Playbooks automáticos", "Alertas por rol"],
  },
  {
    id: "clavconsult",
    name: "Clav Consult",
    tagline: "Implementación y soporte",
    description:
      "Parametrización AFIP, migración de datos, capacitación y soporte dedicado. El brazo humano del grupo.",
    icon: Wrench,
    gradient: "from-orange-600 to-amber-800",
    status: "disponible",
    features: ["Homologación AFIP", "Migración CSV", "Capacitación por rubro"],
  },
  {
    id: "clavanalytics",
    name: "Clav Analytics",
    tagline: "BI y tableros ejecutivos",
    description:
      "KPIs, alertas configurables y dashboards por rol. Extrae valor de los datos que ya genera Clavis.",
    icon: BarChart3,
    gradient: "from-cyan-600 to-sky-800",
    status: "proximamente",
    features: ["KPIs en tiempo real", "Alertas por umbral", "Export ejecutivo"],
  },
]