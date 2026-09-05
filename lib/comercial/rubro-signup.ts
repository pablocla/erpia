/**
 * Puertas de alta (landing + registro).
 * Fuente de verdad: un toque de rubro → tenant.rubro + modoLite + pantalla de entrada.
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"

export interface RubroSignup {
  id: string
  aliases: string[]
  label: string
  emoji: string
  descripcion: string
  /** Valor persistido en empresa.rubro (debe resolver golden path) */
  rubroEmpresa: string
  engancheId: string
  modoLite: ModoLite
  landingPath: string
  marca: string
  lema: string
}

export const RUBROS_SIGNUP: RubroSignup[] = [
  {
    id: "kiosco",
    aliases: ["comercio", "almacen", "almacén", "local"],
    label: "Comercio / Kiosco",
    emoji: "🏪",
    descripcion: "Caja, stock y libreta de fiado",
    rubroEmpresa: "kiosco",
    engancheId: "pos.fiado_barrio",
    modoLite: "fiado",
    landingPath: "/dashboard/fiado",
    marca: "Claver Fiado",
    lema: "Libreta y caja, sin Excel.",
  },
  {
    id: "taller",
    aliases: ["taller_mecanico", "mecanico", "mecánico"],
    label: "Taller mecánico",
    emoji: "🚗",
    descripcion: "Órdenes por patente y aviso al cliente",
    rubroEmpresa: "taller_mecanico",
    engancheId: "niche.taller_mecanico",
    modoLite: "niche",
    landingPath: "/dashboard/nicho/taller",
    marca: "Claver Taller",
    lema: "Órdenes por patente, sin planilla.",
  },
  {
    id: "gimnasio",
    aliases: ["gym", "club", "fitness"],
    label: "Gimnasio / Club",
    emoji: "🏋️",
    descripcion: "Socios, cuotas y morosos",
    rubroEmpresa: "gimnasio",
    engancheId: "niche.gimnasio_barrio",
    modoLite: "niche",
    landingPath: "/dashboard/membresias",
    marca: "Claver Gym",
    lema: "Cuotas en semáforo, cobro en un toque.",
  },
  {
    id: "oficios",
    aliases: ["oficio", "tecnico", "técnico", "cuadrilla"],
    label: "Oficios / Técnicos",
    emoji: "🛠️",
    descripcion: "Presupuestos 3 niveles y seña",
    rubroEmpresa: "oficios",
    engancheId: "niche.oficios",
    modoLite: "niche",
    landingPath: "/dashboard/oficios",
    marca: "Claver Oficios",
    lema: "Presupuesto en el celu, seña anotada.",
  },
  {
    id: "gastronomia",
    aliases: ["resto", "restaurant", "bar", "gastronomía", "bar_restaurant"],
    label: "Gastronomía / Bar",
    emoji: "🍽️",
    descripcion: "Mesas, comandas y carta QR",
    rubroEmpresa: "bar_restaurant",
    engancheId: "pack.gastronomia",
    modoLite: "pos",
    landingPath: "/dashboard/hospitalidad",
    marca: "Claver Restó",
    lema: "Mesas y cocina, sin papel.",
  },
  {
    id: "pyme",
    aliases: ["empresa", "general", "comercio_general"],
    label: "Empresa / General",
    emoji: "🏢",
    descripcion: "POS, stock y ticket interno",
    rubroEmpresa: "pyme",
    engancheId: "pos.core",
    modoLite: "pos",
    landingPath: "/dashboard/pos",
    marca: "Claver POS",
    lema: "Mostrador listo el día uno.",
  },
  {
    id: "sena_eventos",
    aliases: ["eventos", "salon", "salón", "pelotero", "dj", "fotografo", "catering"],
    label: "Seña Eventos / Salón",
    emoji: "🎉",
    descripcion: "Reserva de fechas con seña por WhatsApp",
    rubroEmpresa: "oficios",
    engancheId: "niche.sena_eventos",
    modoLite: "niche",
    landingPath: "/dashboard/oficios",
    marca: "Claver Seña Eventos",
    lema: "Fecha reservada, seña cobrada.",
  },
  {
    id: "alquileres",
    aliases: ["alquiler", "cochera", "cocheras", "deptos", "inquilinos", "alquiler_depto"],
    label: "Alquileres & Cocheras",
    emoji: "🏠",
    descripcion: "Cobro mensual de alquileres y expensas",
    rubroEmpresa: "alquileres",
    engancheId: "niche.alquileres",
    modoLite: "niche",
    landingPath: "/dashboard/membresias",
    marca: "Claver Alquileres",
    lema: "Alquileres al día, sin vergüenza de cobrar.",
  },
  {
    id: "estetica",
    aliases: ["unas", "uñas", "pestanas", "pestañas", "depilacion", "barberia", "peluqueria"],
    label: "Estética & Belleza",
    emoji: "✨",
    descripcion: "Turnera con seña obligatoria del 30%",
    rubroEmpresa: "estetica",
    engancheId: "niche.estetica",
    modoLite: "niche",
    landingPath: "/dashboard/peluqueria",
    marca: "Claver Estética",
    lema: "Cero plantones, tu tiempo vale.",
  },
  {
    id: "academia",
    aliases: ["clases", "instituto", "apoyo_escolar", "musica", "idiomas", "colonia"],
    label: "Academia & Clases",
    emoji: "🎓",
    descripcion: "Control de cuotas y semáforo de alumnos",
    rubroEmpresa: "escuelas",
    engancheId: "niche.escuela_barrio",
    modoLite: "niche",
    landingPath: "/dashboard/membresias",
    marca: "Claver Academia",
    lema: "Cuotas al día, aviso automático al padre.",
  },
  {
    id: "gomeria",
    aliases: ["chapa_pintura", "alineacion", "gomeria_taller"],
    label: "Gomería & Chapa Express",
    emoji: "🚗",
    descripcion: "Aviso de 'Auto Listo' por WhatsApp",
    rubroEmpresa: "taller_mecanico",
    engancheId: "niche.gomeria",
    modoLite: "niche",
    landingPath: "/dashboard/taller",
    marca: "Claver Gomería",
    lema: "Auto listo, box liberado.",
  },
  {
    id: "lavadero",
    aliases: ["detailing", "carwash", "lavado_autos"],
    label: "Lavadero & Detailing",
    emoji: "💧",
    descripcion: "Abonos mensuales de lavado y aviso de retiro",
    rubroEmpresa: "lavadero",
    engancheId: "niche.lavadero",
    modoLite: "niche",
    landingPath: "/dashboard/membresias",
    marca: "Claver Lavadero",
    lema: "Abonos recurrentes, clientes fijos.",
  },
  {
    id: "honorarios",
    aliases: ["kinesiologo", "nutricionista", "psicologo", "abogado", "consultorio"],
    label: "Honorarios & Consultorios",
    emoji: "🩺",
    descripcion: "Turnos particulares con seña",
    rubroEmpresa: "consultorio",
    engancheId: "niche.honorarios",
    modoLite: "niche",
    landingPath: "/dashboard/turnos",
    marca: "Claver Honorarios",
    lema: "Consultas particulares aseguradas.",
  },
  {
    id: "mayorista_fiado",
    aliases: ["distribuidora", "reparto", "fiado_mayorista"],
    label: "Mayorista & Reparto Fiado",
    emoji: "🚚",
    descripcion: "Libreta de cuentas corrientes comerciales",
    rubroEmpresa: "mayorista",
    engancheId: "niche.mayorista_fiado",
    modoLite: "fiado",
    landingPath: "/dashboard/cuentas-cobrar",
    marca: "Claver Mayorista",
    lema: "Cobrá a tus clientes comerciales por WhatsApp.",
  },
]

const BY_KEY = new Map<string, RubroSignup>()
for (const rubro of RUBROS_SIGNUP) {
  BY_KEY.set(rubro.id, rubro)
  for (const alias of rubro.aliases) {
    BY_KEY.set(alias, rubro)
  }
}

function norm(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function resolveRubroSignup(raw: string | null | undefined): RubroSignup | null {
  if (!raw?.trim()) return null
  return BY_KEY.get(norm(raw)) ?? null
}

export function findRubroSignupByEnganche(engancheId: string | null | undefined): RubroSignup | null {
  if (!engancheId) return null
  return RUBROS_SIGNUP.find((r) => r.engancheId === engancheId) ?? null
}

export function defaultRubroSignup(): RubroSignup {
  return RUBROS_SIGNUP[0]!
}

/** Perfil de alta: rubro persistido + modoLite aunque no haya campaña ?activar= */
export function resolveSignupProfile(activar: string | null | undefined): {
  activarKey: string
  rubroEmpresa: string
  modoLite: ModoLite
  landingPath: string
  engancheId: string
} {
  const door = resolveRubroSignup(activar) ?? defaultRubroSignup()
  return {
    activarKey: door.id,
    rubroEmpresa: door.rubroEmpresa,
    modoLite: door.modoLite,
    landingPath: door.landingPath,
    engancheId: door.engancheId,
  }
}
