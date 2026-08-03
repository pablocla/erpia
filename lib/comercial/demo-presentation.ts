/**
 * Modo presentación — sidebar limpio para demo en calle (QR / tablet).
 */

import { getIndustryTemplate } from "@/lib/comercial/industry-templates"

const PRESENT_EXTRA = [
  "/dashboard/configuracion",
  "/dashboard/nicho",
  "/dashboard/apps",
  "/dashboard/fiado",
  "/dashboard/clientes",
  "/dashboard/pos",
  "/dashboard/caja",
  "/dashboard/productos",
  "/dashboard/mi-plan",
]

export function getDemoPresentationPaths(industryId: string): string[] {
  const template = getIndustryTemplate(industryId)
  if (!template) return ["/dashboard", ...PRESENT_EXTRA]

  const paths = new Set<string>([template.goldenPath, "/dashboard", ...PRESENT_EXTRA])
  for (const href of Object.keys(template.menuLabels)) {
    paths.add(href)
  }
  return [...paths]
}

export function isPathAllowedInDemoPresentation(href: string | undefined, industryId: string): boolean {
  if (!href) return true
  const allowed = getDemoPresentationPaths(industryId)
  if (!allowed || !Array.isArray(allowed)) return true
  return allowed.some((path) =>
    path === "/dashboard" ? href === "/dashboard" : href === path || href.startsWith(`${path}/`),
  )
}

export function appendPresentQuery(path: string, present?: boolean): string {
  if (!present) return path
  const sep = path.includes("?") ? "&" : "?"
  return `${path}${sep}present=1`
}