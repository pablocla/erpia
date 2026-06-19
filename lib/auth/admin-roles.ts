export const ADMIN_ROLES = new Set([
  "admin",
  "administrador",
  "gerente",
  "dueno",
  "propietario",
])

export function isAdminRole(rol: string | undefined | null): boolean {
  if (!rol) return false
  return ADMIN_ROLES.has(rol.toLowerCase())
}