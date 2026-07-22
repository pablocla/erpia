import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { defaultModoLiteForRubro } from "@/lib/comercial/nav-matrix"
import { normalizeRubroValue } from "@/lib/onboarding/onboarding-ia"

/**
 * GET /api/ops/tenant-nav-health
 * Lista empresas con modoLite/rubro “ruidoso” y sugiere corrección.
 *
 * - dryRun default true
 * - apply=1 solo si CLAVER_OPS_NAV_FIX=1 (seguridad)
 *
 * Acceso: admin de la empresa solo ve la suya; analyst/cloud puede listar (si rol elevated).
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const apply = req.nextUrl.searchParams.get("apply") === "1"
  const canApply = apply && process.env.CLAVER_OPS_NAV_FIX === "1"
  const elevated = ["administrador", "admin", "dueno", "propietario"].includes(ctx.auth.rol)

  if (!elevated) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  // Por defecto solo la empresa actual (multi-tenant safe).
  // ?scope=all requiere CLAVER_OPS_NAV_FIX y es para ops internas.
  const scopeAll =
    req.nextUrl.searchParams.get("scope") === "all" && process.env.CLAVER_OPS_NAV_FIX === "1"

  const empresas = await prisma.empresa.findMany({
    where: scopeAll ? { deletedAt: null } : { id: ctx.auth.empresaId },
    select: {
      id: true,
      nombre: true,
      rubro: true,
      modoLite: true,
    },
    take: scopeAll ? 500 : 1,
  })

  const suggestions = empresas.map((e) => {
    const rubro = normalizeRubroValue(e.rubro)
    const modo = e.modoLite || "completo"
    const noisy = modo === "completo" || rubro === "otro"
    const suggestedModoLite = defaultModoLiteForRubro(rubro === "otro" ? "kiosco" : rubro)
    const suggestedRubro = rubro === "otro" ? "kiosco" : rubro
    return {
      empresaId: e.id,
      nombre: e.nombre,
      rubroActual: e.rubro,
      modoLiteActual: modo,
      noisy,
      suggestedRubro,
      suggestedModoLite,
      reason: noisy
        ? "Menú ERP completo o rubro genérico: ruido de navegación para pyme"
        : "OK",
    }
  })

  const applied: number[] = []
  if (canApply) {
    for (const s of suggestions.filter((x) => x.noisy)) {
      await prisma.empresa.update({
        where: { id: s.empresaId },
        data: {
          modoLite: s.suggestedModoLite,
          rubro: s.suggestedRubro,
        },
      })
      applied.push(s.empresaId)
    }
  }

  return NextResponse.json({
    success: true,
    dryRun: !canApply,
    scopeAll,
    total: suggestions.length,
    noisy: suggestions.filter((s) => s.noisy).length,
    suggestions,
    applied,
    hint:
      "Para aplicar fixes: CLAVER_OPS_NAV_FIX=1 y ?apply=1&scope=all (solo ops). Sin apply es dry-run.",
  })
}
