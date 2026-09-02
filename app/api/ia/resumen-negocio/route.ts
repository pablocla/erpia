import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarResumenIaNegocio } from "@/lib/ia/resumen-negocio-service"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/ia/resumen-negocio?dias=1|7|30
 * Genera el briefing en lenguaje natural con métricas consolidadas.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const dias = Math.min(Math.max(parseInt(url.searchParams.get("dias") || "1", 10), 1), 30)

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: auth.auth.empresaId },
      select: { nombre: true, rubro: true },
    })

    const resultado = await generarResumenIaNegocio(
      auth.auth.empresaId,
      empresa?.nombre || "tu comercio",
      dias
    )

    return NextResponse.json({ ok: true, ...resultado })
  } catch (error) {
    console.error("[api/ia/resumen-negocio] Error:", error)
    return NextResponse.json({ error: "Error generando el resumen IA" }, { status: 500 })
  }
}
