import type { LucideIcon } from "lucide-react"
import { Layers, Cpu, Wheat, BarChart3, ShieldCheck } from "lucide-react"

export interface ClavergrowPack {
  id: string
  sku: string
  name: string
  tagline: string
  description: string
  icon: LucideIcon
  gradient: string
  features: string[]
  modules: string[]
  priceMonthly: number
  highlighted?: boolean
  badge?: string
}

export interface ClavergrowRubro {
  id: string
  name: string
  description: string
  packs: string[]
}

/** Packs comerciales Clavergrow — producción agrícola end-to-end */
export const CLAVERGROW_PACKS: ClavergrowPack[] = [
  {
    id: "core",
    sku: "grow.core",
    name: "Clavergrow Core",
    tagline: "Lotes, cultivos y trazabilidad de campo",
    description:
      "Base operativa para productores y cooperativas: lotes georreferenciados, NDVI, clima y planificación de campaña.",
    icon: Layers,
    gradient: "from-emerald-600 to-green-800",
    features: ["Mapas y lotes", "NDVI / salud del cultivo", "Clima Open-Meteo", "Plan de campaña"],
    modules: ["Lotes y mapas", "NDVI", "Clima", "Dashboard agro"],
    priceMonthly: 29_900,
    highlighted: true,
    badge: "Base",
  },
  {
    id: "iot",
    sku: "grow.iot",
    name: "Clavergrow IoT",
    tagline: "Sensores, riego y maquinaria conectada",
    description:
      "Centro IoT agro: humedad de suelo, estaciones climáticas, riego inteligente y telemetría de maquinaria.",
    icon: Cpu,
    gradient: "from-teal-600 to-cyan-800",
    features: ["Sensores en tiempo real", "Riego automatizado", "Alertas por umbral", "Maquinaria conectada"],
    modules: ["Agro IoT Center", "Sensores", "Riego inteligente", "Maquinaria"],
    priceMonthly: 19_900,
  },
  {
    id: "acopio",
    sku: "grow.acopio",
    name: "Clavergrow Acopio",
    tagline: "Balanza, contratos y carta de porte",
    description:
      "Para acopios y plantas de recepción: pesadas digitales, contratos de cereales, CPE AFIP y portal productor.",
    icon: Wheat,
    gradient: "from-amber-600 to-orange-800",
    features: ["Balanza camiones", "Contratos cereales", "Carta de porte CPE", "Portal productor"],
    modules: ["Balanza digital", "Contratos", "Liquidaciones", "CPE AFIP"],
    priceMonthly: 39_900,
  },
  {
    id: "trade",
    sku: "grow.trade",
    name: "Clavergrow Trade",
    tagline: "Pizarra, liquidaciones y comercio B2B",
    description:
      "Comercialización de granos: pizarra BCR/Chicago, liquidaciones a productores y seguimiento de posición.",
    icon: BarChart3,
    gradient: "from-lime-600 to-emerald-800",
    features: ["Pizarra de precios", "Liquidaciones", "Posición comercial", "Reportes de campaña"],
    modules: ["Pizarra BCR", "Liquidaciones", "Contratos abiertos", "KPIs acopio"],
    priceMonthly: 14_900,
  },
  {
    id: "regulated",
    sku: "grow.regulated",
    name: "Cultivo regulado",
    tagline: "Trazabilidad REPROCANN y compliance",
    description:
      "Pack para cultivos con marco regulatorio: ciclos, insumos, aplicaciones, suelo y cosecha con auditoría completa.",
    icon: ShieldCheck,
    gradient: "from-green-700 to-emerald-950",
    features: ["Ciclos de cultivo", "Stock de insumos", "Análisis de suelo", "Cupo y compliance"],
    modules: ["Ciclos", "Insumos", "Aplicaciones", "Suelo / sustrato"],
    priceMonthly: 24_900,
    badge: "Regulado",
  },
]

export const CLAVERGROW_RUBROS: ClavergrowRubro[] = [
  {
    id: "agro_acopio",
    name: "Acopio y recepción",
    description: "Plantas de acopio, balanza y comercialización de granos.",
    packs: ["core", "acopio", "trade"],
  },
  {
    id: "agro_productor",
    name: "Productor / campo",
    description: "Explotaciones agrícolas con lotes, IoT y planificación.",
    packs: ["core", "iot"],
  },
  {
    id: "agro_cannabis",
    name: "Cultivo regulado",
    description: "ONGs y operadores con marco REPROCANN — trazabilidad de punta a punta.",
    packs: ["core", "iot", "regulated"],
  },
]

export const CLAVERGROW_FEATURES = [
  "Lotes georreferenciados y NDVI",
  "Balanza digital y tickets de pesada",
  "Contratos y liquidaciones de cereales",
  "Carta de porte electrónica (CPE)",
  "Pizarra BCR / Chicago en tiempo real",
  "IoT: sensores, riego y maquinaria",
  "Portal productor B2B",
  "Cultivo regulado con trazabilidad",
] as const