/**
 * Catálogo client-safe del switcher de experiencias (actores / rubros).
 * Sin Prisma ni jose — se puede importar en el dashboard.
 */

import { ROLES_SISTEMA, type RolSistema } from "@/lib/auth/roles"
import { getHomePathForRol } from "@/lib/auth/home-redirect"
import { INDUSTRY_TEMPLATES } from "@/lib/comercial/industry-templates"

export const PREVIEW_OPEN_EVENT = "claver:open-experience-switcher"

export type PreviewActor = {
  codigo: string
  nombre: string
  descripcion: string
  tagline: string
}

export const PREVIEW_OWNER_ACTOR: PreviewActor = {
  codigo: "dueno",
  nombre: "Dueño / Admin del ERP",
  descripcion: "Panel completo del comercio: costos, caja, config y reportes.",
  tagline: "La vista del dueño del local",
}

export const PREVIEW_ACTORS: PreviewActor[] = ROLES_SISTEMA.filter((r) => r.codigo !== "dueno").map(
  (r) => ({
    codigo: r.codigo,
    nombre: r.nombre,
    descripcion: r.descripcion,
    tagline: r.tagline,
  }),
)

export function listPreviewActors(): PreviewActor[] {
  return [PREVIEW_OWNER_ACTOR, ...PREVIEW_ACTORS]
}

export function listPreviewRubros() {
  return INDUSTRY_TEMPLATES.filter((t) => t.featured).map((t) => ({
    id: t.id,
    label: t.label,
    emoji: t.emoji,
    tagline: t.tagline,
    group: t.group,
    goldenPath: t.goldenPath,
  }))
}

export function isPreviewActorCodigo(rol: string): rol is RolSistema | "administrador" {
  if (rol === "administrador" || rol === "admin" || rol === "dueno") return true
  return ROLES_SISTEMA.some((r) => r.codigo === rol)
}

export function labelForPreviewActor(rol: string): string {
  if (rol === "administrador" || rol === "admin") return PREVIEW_OWNER_ACTOR.nombre
  return ROLES_SISTEMA.find((r) => r.codigo === rol)?.nombre ?? rol
}

export function homePathForPreviewRol(rol: string): string {
  if (rol === "dueno") return "/dashboard"
  return getHomePathForRol(rol)
}
