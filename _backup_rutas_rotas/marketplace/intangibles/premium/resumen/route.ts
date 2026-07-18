import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { analizarRiesgoPosHoy } from "@/lib/marketplace/guardian-pos-service"
import { conciliarLiquidacionPagos } from "@/lib/marketplace/liquidacion-pagos-service"
import { generarPropuestasReposicion } from "@/lib/marketplace/reponedor-jit-service"
import { auditarPercepcionesRecuperables } from "@/lib/marketplace/recuperador-fiscal-service"
import { INTANGIBLE_PREMIUM_7 } from "@/lib/marketplace/intangible-premium-7"
import { obtenerEstadoProductos } from "@/lib/platform/product-lifecycle"

/**
 * GET /api/marketplace/intangibles/premium/resumen
 * Dashboard resumen de servicios Premium 7 activables.
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { empresaId } = ctx.auth
  const vista = request.nextUrl.searchParams.get("vista")

  if (vista === "catalogo") {
    return NextResponse.json({ servicios: INTANGIBLE_PREMIUM_7 })
  }

  const [guardian, liquidacion, reposicion, fiscal, productos] = await Promise.all([
    analizarRiesgoPosHoy(empresaId),
    conciliarLiquidacionPagos(empresaId),
    generarPropuestasReposicion(empresaId),
    auditarPercepcionesRecuperables(empresaId),
    obtenerEstadoProductos(empresaId),
  ])

  const premiumSkus = INTANGIBLE_PREMIUM_7.map((s) => s.sku)

  return NextResponse.json({
    guardianPos: guardian,
    liquidacionPagos: liquidacion,
    recuperadorFiscal: fiscal,
    reponedorJit: {
      total: reposicion.length,
      urgentes: reposicion.filter((p) => p.urgencia === "alta").length,
      propuestas: reposicion.slice(0, 10),
    },
    activaciones: productos.productos
      .filter((p) => premiumSkus.includes(p.sku))
      .map((p) => ({
        sku: p.sku,
        activo: p.activo,
        dependenciasOk: p.dependenciasOk,
        dependenciasFaltantes: p.dependenciasFaltantes,
      })),
    servicios: INTANGIBLE_PREMIUM_7.map((s) => ({
      sku: s.sku,
      nombre: s.nombre,
      status: s.status,
      precioArs: s.precioArs,
      activo: productos.mapa[s.sku] === true,
    })),
  })
}