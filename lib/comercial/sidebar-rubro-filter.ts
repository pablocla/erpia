/**
 * Sidebar enfocado por rubro / demo — auditoría F0-1, AD-003.
 */

import type { Rubro } from "@/lib/onboarding/onboarding-ia"
import { getRubroUx } from "@/lib/onboarding/onboarding-ia"
import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { getDemoPresentationPaths } from "@/lib/comercial/demo-presentation"
import {
  getIndustryTemplate,
  getIndustryTemplateByRubro,
} from "@/lib/comercial/industry-templates"
import { isPathAllowedInSidebarAllowlist } from "@/lib/marketplace/sku-availability"

const SECTIONS_ALWAYS = new Set(["Principal", "Claver Nicho", "Configuración"])

const MODULO_AGRO_ONLY = new Set(["agro"])
const MODULO_INDUSTRIAL = new Set([
  "industria",
  "iot",
  "importacion",
  "reventas",
  "concesionaria",
  "prestamos",
  "picking",
])

function pathsForIndustry(industryId: string): string[] {
  const base = getDemoPresentationPaths(industryId)
  return [...new Set([...base, "/dashboard/nicho", "/dashboard/apps"])]
}

/**
 * null = mostrar todo (admin / ERP completo).
 * string[] = solo hrefs permitidos.
 */
export function getSidebarAllowlist(opts: {
  rubro: Rubro
  industryId?: string | null
  modoLite: ModoLite | string
  presentMode: boolean
  isAdmin: boolean
}): string[] | null {
  const { rubro, industryId, modoLite, presentMode, isAdmin } = opts

  if (isAdmin && modoLite === "completo" && !presentMode && !industryId && rubro === "otro") {
    return null
  }

  if (presentMode && industryId) {
    return pathsForIndustry(industryId)
  }

  if (industryId) {
    const t = getIndustryTemplate(industryId)
    if (t && t.id !== "otro") return pathsForIndustry(industryId)
  }

  if (modoLite !== "completo") {
    return null
  }

  if (rubro !== "otro") {
    const byRubro = getIndustryTemplateByRubro(rubro)
    if (byRubro) {
      const paths = new Set(pathsForIndustry(byRubro.id))
      return [...paths]
    }
  }

  return null
}

export function isModuloSectionVisible(
  moduloLabel: string,
  moduloKey: string | undefined,
  rubro: Rubro,
  allowlist: string[] | null,
): boolean {
  if (SECTIONS_ALWAYS.has(moduloLabel)) return true
  if (!allowlist) {
    if (rubro === "otro") return true
    if (moduloKey && MODULO_AGRO_ONLY.has(moduloKey)) {
      return rubro.startsWith("agro_")
    }
    if (moduloKey && MODULO_INDUSTRIAL.has(moduloKey)) {
      return false
    }
    const prioridad = new Set(getRubroUx(rubro).sidebarPrioridad)
    if (moduloKey) return prioridad.has(moduloKey)
    return false
  }
  return true
}

export function isMenuHrefVisibleInAllowlist(href: string | undefined, allowlist: string[] | null): boolean {
  if (!href) return false
  if (!allowlist) return true
  return isPathAllowedInSidebarAllowlist(href, allowlist)
}