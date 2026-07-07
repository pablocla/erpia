// @ts-nocheck
import { getRubroUx, type Rubro } from "@/lib/onboarding/onboarding-ia"
import { ROLES_SISTEMA } from "@/lib/auth/roles"
import type { CountryFeatures } from "@/lib/country/country-features"
import type { DashboardMenuItem, DashboardModuloSection } from "@/lib/dashboard/sidebar-modules"

function getRoleDefinition(role?: string) {
  if (!role) return null
  return ROLES_SISTEMA.find((rol) => rol.codigo === role)
}

function hasRoleAccessToModulo(role: string | undefined, modulo: string): boolean {
  if (!role) return false
  if (["administrador", "admin", "dueno"].includes(role)) return true
  const def = getRoleDefinition(role)
  return def?.modulosAcceso.some((m) => m.modulo === modulo) ?? false
}

export function canRenderMenuItem(
  item: DashboardMenuItem,
  role: string | undefined,
  modulosActivos: Record<string, boolean> | null,
  features: Record<string, boolean> | null,
  productosSku: Record<string, boolean> | null,
  userId: string | null,
  rubro: Rubro,
  isClaverAnalyst: boolean,
  countryFeatures: CountryFeatures,
  condicionIva?: string,
): boolean {
  if (condicionIva?.toLowerCase() === "monotributista" || condicionIva?.toLowerCase() === "monotributo") {
    if (item.href?.startsWith("/dashboard/contabilidad")) return false
    if (item.href === "/dashboard/impuestos/iibb") return false
    if (item.href === "/dashboard/impuestos/padron") return false
    if (item.href === "/dashboard/impuestos/tes") return false
    if (item.label?.toLowerCase().includes("retencion")) return false
    if (item.label?.toLowerCase().includes("sicore")) return false
  }

  if (item.requiredCountryFeature) {
    if (!countryFeatures[item.requiredCountryFeature as keyof CountryFeatures]) {
      return false
    }
  }

  if (item.claverAnalystOnly && !isClaverAnalyst) return false

  if (item.skuKey && productosSku && productosSku[item.skuKey] !== true) return false

  if (["administrador", "admin", "dueno"].includes(role || "")) return true

  if (!role) {
    if (item.featureKey) {
      if (features && features[item.featureKey] === false) return false
      if (modulosActivos && modulosActivos[item.featureKey] === false) return false
    }
    return true
  }

  if (item.allowedUsers?.length && userId) {
    if (!item.allowedUsers.includes(userId)) return false
  }

  if (item.allowedRoles) {
    if (!item.allowedRoles.includes(role)) return false
  }

  if (item.allowedRubros && !item.allowedRubros.includes(rubro)) {
    return false
  }

  if (item.excludedRoles && item.excludedRoles.includes(role)) return false

  if (item.permisoModulo) {
    if (!hasRoleAccessToModulo(role, item.permisoModulo)) return false
  }

  if (item.featureKey) {
    if (features && features[item.featureKey] === false) return false
    if (modulosActivos && modulosActivos[item.featureKey] === false) return false
  }

  return true
}

function getModuloScore(
  modulo: { label: string; moduloKey?: string },
  index: number,
  prioridad: string[],
) {
  if (modulo.label === "Principal") return -1000
  if (modulo.label === "Claver Nicho") return -800
  if (modulo.label === "Configuración") return 10000 + index
  if (!modulo.moduloKey) return 5000 + index
  const priorityIndex = prioridad.indexOf(modulo.moduloKey)
  if (priorityIndex === -1) return 3000 + index
  return 100 + priorityIndex
}

export function ordenarModulosPorRubro(
  modulos: DashboardModuloSection[],
  rubro: Rubro,
): DashboardModuloSection[] {
  const prioridad = getRubroUx(rubro).sidebarPrioridad
  return modulos
    .map((modulo, index) => ({ modulo, index }))
    .sort((a, b) => {
      const scoreA = getModuloScore(a.modulo, a.index, prioridad)
      const scoreB = getModuloScore(b.modulo, b.index, prioridad)
      return scoreA - scoreB
    })
    .map(({ modulo }) => modulo)
}