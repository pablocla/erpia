import type { LucideIcon } from "lucide-react"
import {
  Layers,
  Cpu,
  Wheat,
  BarChart3,
  ShieldCheck,
  Sprout,
  Thermometer,
  Camera,
  Zap,
  Package,
} from "lucide-react"

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

/** Fases del ciclo — lenguaje universal (campo, indoor, invernadero, ONG, I+D) */
export interface ClavergrowLifecyclePhase {
  id: string
  label: string
  description: string
  icon: LucideIcon
  capabilities: string[]
}

export const CLAVERGROW_LIFECYCLE: ClavergrowLifecyclePhase[] = [
  {
    id: "material",
    label: "Material vegetal",
    description: "Genéticas, lotes de origen y trazabilidad desde la semilla o el esqueje.",
    icon: Sprout,
    capabilities: ["Catálogo de variedades", "Lote de origen", "Stock de propagación"],
  },
  {
    id: "ambiente",
    label: "Salas y modos",
    description: "Indoor, invernadero u outdoor — capacidad, racks y planificación por cámara.",
    icon: Layers,
    capabilities: ["Salas / cámaras", "Modo de cultivo", "Capacidad y ocupación"],
  },
  {
    id: "ciclo",
    label: "Etapas del ciclo",
    description: "Propagación, vegetativo, floración, secado y curado con registro por lote.",
    icon: Package,
    capabilities: ["Etapas configurables", "Avance por lote", "Cosecha y rendimiento"],
  },
  {
    id: "insumos",
    label: "Insumos y aplicaciones",
    description: "Nutrientes, sustrato, fitosanitarios — dosis, costo por ciclo y stock mínimo.",
    icon: ShieldCheck,
    capabilities: ["Stock e insumos", "Aplicaciones", "Costo por m² / ciclo"],
  },
  {
    id: "iot",
    label: "Sensores y cámaras",
    description: "Temperatura, humedad, lux, riego y alertas; integración con cámaras y estaciones.",
    icon: Thermometer,
    capabilities: ["Umbrales y alertas", "Histórico climático", "Cámaras / telemetría"],
  },
  {
    id: "costos",
    label: "Costos fijos y energía",
    description: "LED, electricidad, alquiler, personal y burn mensual por sala o proyecto.",
    icon: Zap,
    capabilities: ["Centros de costo", "Energía / iluminación", "Dashboard administración"],
  },
  {
    id: "compliance",
    label: "Auditoría y habilitación",
    description: "Libro de operaciones, cupos y documentación para directorio o marco regulatorio.",
    icon: Camera,
    capabilities: ["Perfil operador", "Trazabilidad exportable", "Alertas de vencimiento"],
  },
]

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
    tagline: "Sensores, cámaras, riego y alertas",
    description:
      "Centro IoT: temperatura, humedad, estaciones, riego inteligente, consumo eléctrico y cámaras en sala.",
    icon: Cpu,
    gradient: "from-teal-600 to-cyan-800",
    features: [
      "Sensores en tiempo real",
      "Alertas por umbral",
      "Riego y consumo",
      "Cámaras y telemetría",
    ],
    modules: ["Agro IoT Center", "Sensores", "Riego inteligente", "Cámaras"],
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
    name: "Ambiente controlado",
    tagline: "Ciclo completo indoor e invernadero",
    description:
      "Material vegetal, salas, etapas, insumos, costos fijos y auditoría — para instalaciones que requieren trazabilidad estricta.",
    icon: ShieldCheck,
    gradient: "from-green-700 to-emerald-950",
    features: [
      "Genéticas y lotes",
      "Ciclos por etapa",
      "Costos por sala",
      "Libro de operaciones",
    ],
    modules: ["Salas", "Ciclos", "Insumos", "Suelo / sustrato"],
    priceMonthly: 24_900,
    badge: "Indoor",
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
    id: "agro_indoor",
    name: "Ambiente controlado",
    description:
      "Indoor, invernadero, vivero o I+D — ciclo completo con sensores, costos fijos y trazabilidad.",
    packs: ["core", "iot", "regulated"],
  },
  {
    id: "agro_ong",
    name: "ONG / institución",
    description:
      "Operaciones sin fines de lucro: transparencia de costos, voluntarios y tablero para directorio.",
    packs: ["iot", "regulated"],
  },
]

export const CLAVERGROW_FEATURES = [
  "Material vegetal y lotes trazables",
  "Salas indoor, invernadero y outdoor",
  "Etapas: propagación → cosecha",
  "Insumos, aplicaciones y costo por ciclo",
  "IoT: T°, HR, riego, energía y cámaras",
  "Costos fijos y dashboard administración",
  "Balanza, acopio y comercio B2B",
  "Auditoría y habilitación operativa",
] as const