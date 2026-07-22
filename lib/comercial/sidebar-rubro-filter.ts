/**
 * Sidebar enfocado por rubro / demo / matriz nav.
 */

import type { Rubro } from "@/lib/onboarding/onboarding-ia"
import { getRubroUx, normalizeRubroValue } from "@/lib/onboarding/onboarding-ia"
import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { getDemoPresentationPaths } from "@/lib/comercial/demo-presentation"
import {
  getIndustryTemplate,
  getIndustryTemplateByRubro,
} from "@/lib/comercial/industry-templates"
import { isPathAllowedInSidebarAllowlist } from "@/lib/marketplace/sku-availability"
import { getNavAllowlistForRubro, isPackLiteMode } from "@/lib/comercial/nav-matrix"

const SECTIONS_ALWAYS = new Set(["Principal", "Claver Nicho", "Claver Platform", "Configuración"])

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
  return [...new Set([...base, "/dashboard/nicho", "/dashboard/apps", "/dashboard/mi-plan", "/dashboard/configuracion"])]
}

/**
 * null = no apply path allowlist (other filters still apply).
 * string[] = only those hrefs (prefix match).
 */
export function getSidebarAllowlist(opts: {
  rubro: Rubro | string
  industryId?: string | null
  modoLite: ModoLite | string
  presentMode: boolean
  isAdmin: boolean
}): string[] | null {
  const rubro = normalizeRubroValue(opts.rubro)
  const { industryId, modoLite, presentMode, isAdmin } = opts

  // Pack lite: LITE_MENU_PATHS se aplica en otro filtro; no doblar con allowlist industria
  if (isPackLiteMode(modoLite)) {
    return null
  }

  // Demo presentación: solo paths del pitch
  if (presentMode && industryId) {
    return pathsForIndustry(industryId)
  }

  // Industry demo explícita
  if (industryId) {
    const t = getIndustryTemplate(industryId)
    if (t && t.id !== "otro") {
      const fromMatrix = getNavAllowlistForRubro(t.rubro)
      if (fromMatrix) {
        return [...new Set([...fromMatrix, ...pathsForIndustry(industryId)])]
      }
      return pathsForIndustry(industryId)
    }
  }

  // ERP completo + rubro oficio conocido → matriz (también dueños)
  if (rubro !== "otro") {
    const matrix = getNavAllowlistForRubro(rubro)
    if (matrix) return matrix

    const byRubro = getIndustryTemplateByRubro(rubro)
    if (byRubro) {
      const m = getNavAllowlistForRubro(byRubro.rubro)
      if (m) return m
      return pathsForIndustry(byRubro.id)
    }
  }

  // Admin + completo + rubro otro: sin allowlist (ERP full power-user)
  if (isAdmin && modoLite === "completo" && rubro === "otro") {
    return null
  }

  return null
}

export function isModuloSectionVisible(
  moduloLabel: string,
  moduloKey: string | undefined,
  rubro: Rubro | string,
  allowlist: string[] | null,
): boolean {
  const r = normalizeRubroValue(rubro)
  if (SECTIONS_ALWAYS.has(moduloLabel)) return true

  if (!allowlist) {
    if (r === "otro") return true
    if (moduloKey && MODULO_AGRO_ONLY.has(moduloKey)) {
      return r.startsWith("agro_")
    }
    if (moduloKey && MODULO_INDUSTRIAL.has(moduloKey)) {
      // Solo si el rubro de la matriz industrial lo necesita (allowlist null + prioridad)
      const prioridad = new Set(getRubroUx(r).sidebarPrioridad)
      return prioridad.has(moduloKey)
    }
    const prioridad = new Set(getRubroUx(r).sidebarPrioridad)
    if (moduloKey) return prioridad.has(moduloKey)
    // Secciones sin moduloKey (Fiscal): visibles si hay ítems tras filtro de paths
    return true
  }

  // Con allowlist: la sección se muestra si queda al menos un ítem (lo decide el caller)
  return true
}

export function isMenuHrefVisibleInAllowlist(href: string | undefined, allowlist: string[] | null): boolean {
  if (!href) return false
  if (!allowlist) return true
  return isPathAllowedInSidebarAllowlist(href, allowlist)
}
