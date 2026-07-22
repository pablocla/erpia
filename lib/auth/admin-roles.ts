/**
 * Roles con privilegios de administración de tenant (empresa).
 * Unifica variantes históricas: dueno (Google/roles.ts), administrador (signup clásico), admin.
 */
export const ADMIN_ROLES = new Set([
  "admin",
  "administrador",
  "gerente",
  "dueno",
  "propietario",
])

/** Roles que pueden gestionar usuarios (invitar, editar, desactivar). */
export const USER_MANAGER_ROLES = new Set([
  "admin",
  "administrador",
  "dueno",
  "propietario",
])

export function isAdminRole(rol: string | undefined | null): boolean {
  if (!rol) return false
  return ADMIN_ROLES.has(rol.toLowerCase())
}

export function canManageUsers(rol: string | undefined | null): boolean {
  if (!rol) return false
  return USER_MANAGER_ROLES.has(rol.toLowerCase())
}

/** Roles asignables a subusuarios (no dueño de la cuenta). */
export const ASSIGNABLE_ROLES = [
  "administrador",
  "gerente",
  "cajero",
  "vendedor",
  "contador",
  "mozo",
  "profesional",
  "deposito",
  "vendedor_ruta",
  "personal_servicio",
  "stakeholder",
] as const

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export function isAssignableRole(rol: string): rol is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(rol)
}
