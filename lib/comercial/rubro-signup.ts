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
