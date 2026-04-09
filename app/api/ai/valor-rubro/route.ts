import { NextResponse } from "next/server"
import { getIAConfigRubro, IA_POR_RUBRO, getAllIAFeatures } from "@/lib/ai"

/**
 * GET /api/ai/valor-rubro — Returns IA value proposition for each rubro
 * Query params: ?rubro=bar_restaurant (optional, returns all if omitted)
 * Public endpoint — used by marketing pages and onboarding
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const rubroParam = url.searchParams.get("rubro")

    if (rubroParam) {
      const config = getIAConfigRubro(rubroParam)
      return NextResponse.json({ success: true, rubro: config })
    }

    // Return all rubros with their IA config
    const rubros = Object.entries(IA_POR_RUBRO).map(([key, config]) => ({
      id: key,
      nombre: config.nombreRubro,
      modeloPrincipal: config.modeloPrincipal,
      top3Features: config.top3,
      totalFeatures: config.features.length,
      horasAhorradasMes: config.horasAhorradasMes,
      argumentoVentaIA: config.argumentoVentaIA,
      features: config.features.map(f => ({
        id: f.id,
        nombre: f.nombre,
        impacto: f.impacto,
        tier: f.tier,
        valorRubro: f.valorRubro,
      })),
    }))

    const allFeatures = getAllIAFeatures()

    return NextResponse.json({
      success: true,
      rubros,
      totalRubros: rubros.length,
      totalFeaturesUnicas: allFeatures.length,
      resumen: {
        horasTotalesAhorradasMes: rubros.reduce((s, r) => s + r.horasAhorradasMes, 0),
        featuresMasUsadas: ["alertas_inteligentes", "prediccion_compras", "reportes_naturales"],
        modeloRecomendado: "Qwen 2.5 14B Q5 en RTX 5070 Ti 16GB",
      },
    })
  } catch (error) {
    console.error("[AI Valor Rubro] Error:", error)
    return NextResponse.json({ error: "Error al obtener valor por rubro" }, { status: 500 })
  }
}
