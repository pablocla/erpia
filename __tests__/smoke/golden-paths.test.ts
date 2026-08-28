/**
 * Golden Paths — verifica que cada industria del catálogo tiene su ruta resuelta.
 *
 * Para rutas `/dashboard/nicho/*` → el appId debe existir en niche-apps-catalog.
 * Para otras rutas → el directorio debe tener page.tsx o page.ts.
 *
 * Si este test falla, un usuario que elige ese rubro en el onboarding
 * va a caer en un 404.
 */
import { describe, it, expect } from "vitest"
import { existsSync } from "fs"
import { resolve } from "path"
import { INDUSTRY_TEMPLATES } from "@/lib/comercial/industry-templates"
import { getNicheApp, NICHE_APPS } from "@/lib/niche/niche-apps-catalog"

const ROOT = process.cwd()

function routeExists(goldenPath: string): boolean {
  // Strip trailing slash
  const clean = goldenPath.replace(/\/$/, "")

  // Convert route to filesystem path and check for page.tsx/page.ts first
  const fsPath = clean.replace(/^\//, "").replace(/\//g, "/")
  const dir = resolve(ROOT, "app", fsPath)
  if (existsSync(resolve(dir, "page.tsx")) || existsSync(resolve(dir, "page.ts"))) {
    return true
  }

  // /dashboard/nicho/xxx → check niche catalog (dynamic [appId] route)
  const nichoMatch = clean.match(/^\/dashboard\/nicho\/([^/]+)$/)
  if (nichoMatch) {
    const appId = nichoMatch[1]
    return !!getNicheApp(appId)
  }

  return false
}

describe("Golden paths — todas las industrias resuelven", () => {
  const seen = new Set<string>()

  for (const tpl of INDUSTRY_TEMPLATES) {
    // Avoid duplicate tests for same path
    if (seen.has(tpl.goldenPath)) continue
    seen.add(tpl.goldenPath)

    it(`${tpl.emoji} ${tpl.label} → ${tpl.goldenPath}`, () => {
      expect(routeExists(tpl.goldenPath)).toBe(true)
    })
  }
})

describe("Golden paths — niche apps resuelven o redirigen", () => {
  for (const app of NICHE_APPS) {
    it(`${app.emoji} ${app.nombre} → ${app.goldenPath}`, () => {
      if (app.redirectPath) {
        // Redirect apps should point to an existing module page
        const fsPath = app.redirectPath.replace(/^\//, "").replace(/\//g, "/")
        const dir = resolve(ROOT, "app", fsPath)
        const exists =
          existsSync(resolve(dir, "page.tsx")) ||
          existsSync(resolve(dir, "page.ts"))
        expect(exists).toBe(true)
      } else {
        // Non-redirect apps must be in the niche catalog (dynamic [appId] route)
        expect(getNicheApp(app.appId)).toBeDefined()
      }
    })
  }
})

describe("Golden paths — menuLabels no apuntan a 404", () => {
  const allMenuPaths = new Set<string>()

  for (const tpl of INDUSTRY_TEMPLATES) {
    for (const href of Object.keys(tpl.menuLabels)) {
      allMenuPaths.add(href)
    }
  }

  for (const href of allMenuPaths) {
    it(`menu ${href}`, () => {
      expect(routeExists(href)).toBe(true)
    })
  }
})
