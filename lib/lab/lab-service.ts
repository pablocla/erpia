import { prisma } from "@/lib/prisma"

export interface LabLeadItem {
  id: string
  nombre: string
  direccion: string
  zona: "Echesortu" | "Pellegrini" | "Pichincha" | "Peatonal Córdoba" | "Fisherton" | "Arroyito" | "Zona Sur"
  rubro: "Almacén" | "Kiosco" | "Gastronomía" | "Indumentaria" | "Servicios" | "Autoservicio" | "Taller"
  estado: "frio" | "contactado" | "demo_agendada" | "trial_activo" | "cliente" | "perdido"
  productoTarget: string
  mrrEstimado: number
  ultimoContacto?: string
  telefono?: string
}

export interface LabMissionItem {
  id: string
  titulo: string
  categoria: "Ventas" | "Producto" | "Marketing" | "Finanzas" | "Networking"
  prioridad: "alta" | "media" | "baja"
  completada: boolean
  impacto: string
}

export interface LabRegulationItem {
  id: string
  normativa: string
  jurisdiccion: "Nacional" | "Provincial" | "Municipal"
  queExige: string
  argumentoVenta: string
  urgencia: "alta" | "media" | "normal"
}

export interface LabMilestoneItem {
  id: string
  fase: string
  titulo: string
  descripcion: string
  completado: boolean
  hitoSalida: string
}

export const INITIAL_LAB_LEADS: LabLeadItem[] = [
  {
    id: "lead-1",
    nombre: "Autoservicio Don Pedro",
    direccion: "Mendoza 3420, Rosario",
    zona: "Echesortu",
    rubro: "Almacén",
    estado: "demo_agendada",
    productoTarget: "Fiado + Leo Cobranza",
    mrrEstimado: 19900,
    ultimoContacto: "2026-07-22",
    telefono: "3415551234",
  },
  {
    id: "lead-2",
    nombre: "La Cervecería del Bulevar",
    direccion: "Av. Pellegrini 1450, Rosario",
    zona: "Pellegrini",
    rubro: "Gastronomía",
    estado: "trial_activo",
    productoTarget: "POS + Comandas + KDS",
    mrrEstimado: 25000,
    ultimoContacto: "2026-07-21",
    telefono: "3415555678",
  },
  {
    id: "lead-3",
    nombre: "Kiosco 24hs San Martín",
    direccion: "San Martín 920, Rosario",
    zona: "Peatonal Córdoba",
    rubro: "Kiosco",
    estado: "contactado",
    productoTarget: "Fiado Digital",
    mrrEstimado: 14900,
    ultimoContacto: "2026-07-20",
    telefono: "3415559012",
  },
  {
    id: "lead-4",
    nombre: "Consultorio Estético Fisherton",
    direccion: "Córdoba 7800, Rosario",
    zona: "Fisherton",
    rubro: "Servicios",
    estado: "frio",
    productoTarget: "Turnos + Sofía Confirmá",
    mrrEstimado: 19900,
    ultimoContacto: "2026-07-18",
    telefono: "3415553456",
  },
  {
    id: "lead-5",
    nombre: "Boutique Italia",
    direccion: "Córdoba 1240, Rosario",
    zona: "Peatonal Córdoba",
    rubro: "Indumentaria",
    estado: "frio",
    productoTarget: "Stock + Facturación AFIP",
    mrrEstimado: 25000,
    ultimoContacto: "2026-07-15",
    telefono: "3415557890",
  },
  {
    id: "lead-6",
    nombre: "Ferretería El Candado",
    direccion: "Av. Alberdi 650, Rosario",
    zona: "Arroyito",
    rubro: "Autoservicio",
    estado: "contactado",
    productoTarget: "Pack Almacén + Balanza",
    mrrEstimado: 25000,
    ultimoContacto: "2026-07-19",
    telefono: "3415552345",
  },
]

export const INITIAL_LAB_MISSIONS: LabMissionItem[] = [
  {
    id: "m-1",
    titulo: "Enviar 3 mensajes de WhatsApp a prospectos de Echesortu",
    categoria: "Ventas",
    prioridad: "alta",
    completada: false,
    impacto: "Alta probabilidad de agendar 1 demo hoy",
  },
  {
    id: "m-2",
    titulo: "Revisar prueba de Leo Cobranza en Autoservicio Don Pedro",
    categoria: "Producto",
    prioridad: "alta",
    completada: true,
    impacto: "Asegura la conversión de trial a cliente pago",
  },
  {
    id: "m-3",
    titulo: "Publicar 1 video corto mostrando el cobro express en 3s",
    categoria: "Marketing",
    prioridad: "media",
    completada: false,
    impacto: "Inbound de comercios de barrio en Instagram",
  },
  {
    id: "m-4",
    titulo: "Contactar a 1 contador local para presentar el Portal Contador",
    categoria: "Networking",
    prioridad: "media",
    completada: false,
    impacto: "Canal de referidos recurrente sin costo",
  },
]

export const LAB_REGULATIONS: LabRegulationItem[] = [
  {
    id: "reg-1",
    normativa: "RG 4291 AFIP — Factura Electrónica Obligatoria",
    jurisdiccion: "Nacional",
    queExige: "Emisión obligatoria de comprobantes electrónicos para Monotributistas y Responsables Inscriptos.",
    argumentoVenta: "Con Claver emitís comprobantes sin entrar a la web de AFIP y sin que se te caiga el sistema.",
    urgencia: "alta",
  },
  {
    id: "reg-2",
    normativa: "RG 5616 AFIP — Libro IVA Digital Directo",
    jurisdiccion: "Nacional",
    queExige: "Presentación mensual del detalle digital de compras y ventas.",
    argumentoVenta: "Tu contador descarga el archivo Libro IVA Digital desde Claver en 1 clic sin pedirte papeles.",
    urgencia: "alta",
  },
  {
    id: "reg-3",
    normativa: "Ordenanza 9794 Rosario — Exhibición de Precios Claras",
    jurisdiccion: "Municipal",
    queExige: "Obligatoriedad de exhibir precios actualizados y visibles al público.",
    argumentoVenta: "Actualizá 5.000 precios por IPC en 2 segundos con la reexpresión automática de Claver.",
    urgencia: "media",
  },
  {
    id: "reg-4",
    normativa: "Res. Gral. 15/2024 API Santa Fe — Régimen IIBB",
    jurisdiccion: "Provincial",
    queExige: "Percepción y retención digitalizada de Ingresos Brutos Santa Fe.",
    argumentoVenta: "Claver calcula las alícuotas de IIBB Santa Fe automáticamente en cada comprobante.",
    urgencia: "normal",
  },
]

export const LAB_MILESTONES: LabMilestoneItem[] = [
  {
    id: "fase-0",
    fase: "Fase 0",
    titulo: "Cimientos del Sistema",
    descripcion: "Motor POS, AFIP, PWA Offline y arquitectura multi-tenant",
    completado: true,
    hitoSalida: "Compilación clean sin errores + Deploy en Vercel",
  },
  {
    id: "fase-1",
    fase: "Fase 1",
    titulo: "Producto Mínimo Vendible (PLG)",
    descripcion: "Leo Cobranza funcional + Libreta de Fiado + POS Mostrador",
    completado: false,
    hitoSalida: "1er comercio real operando con Leo en producción",
  },
  {
    id: "fase-2",
    fase: "Fase 2",
    titulo: "Primeros 5 Clientes Pagos",
    descripcion: "Ventas directas en Rosario (Echesortu, Pellegrini, Peatonal)",
    completado: false,
    hitoSalida: "5 suscripciones activas ($100.000 ARS/mes MRR)",
  },
  {
    id: "fase-3",
    fase: "Fase 3",
    titulo: "Product-Market Fit & Red de Contadores",
    descripcion: "Canal de contadores + retención >80% al mes 3",
    completado: false,
    hitoSalida: "20 clientes activos + churn <10%",
  },
  {
    id: "fase-4",
    fase: "Fase 4",
    titulo: "Escala Regional Santa Fe",
    descripcion: "Expansión a Gran Rosario, San Lorenzo y Santa Fe Capital",
    completado: false,
    hitoSalida: "50 clientes activos ($1M ARS/mes MRR)",
  },
]

export function calcularMetricasLab(leads: LabLeadItem[]) {
  const mrrActual = leads
    .filter((l) => l.estado === "cliente")
    .reduce((sum, l) => sum + l.mrrEstimado, 0)

  const pipelinePotencial = leads
    .filter((l) => l.estado === "demo_agendada" || l.estado === "trial_activo" || l.estado === "contactado")
    .reduce((sum, l) => sum + l.mrrEstimado, 0)

  const leadsTotal = leads.length
  const demosActivas = leads.filter((l) => l.estado === "demo_agendada" || l.estado === "trial_activo").length
  const metaMes = 60000 // $60.000 ARS inicial
  const progresoMeta = Math.min(100, Math.round((mrrActual / metaMes) * 100))

  return {
    mrrActual,
    pipelinePotencial,
    leadsTotal,
    demosActivas,
    metaMes,
    progresoMeta,
    burnRate: 0, // Cero costo fijo inicial
    runwayMeses: "Infinito",
  }
}
