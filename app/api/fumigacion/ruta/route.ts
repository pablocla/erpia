import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getRutaFumigacionDia } from "@/lib/fumigacion/fumigacion-ruta-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const fechaRaw = searchParams.get("fecha")
  const tecnico = searchParams.get("tecnico") ?? undefined
  const optimizarProximidad = searchParams.get("optimizarProximidad") === "true"

  let fecha: Date | undefined
  if (fechaRaw) {
    const parsed = new Date(`${fechaRaw}T12:00:00`)
    if (!Number.isNaN(parsed.getTime())) fecha = parsed
  }

  try {
    const ruta = await getRutaFumigacionDia(auth.auth.empresaId, {
      fecha,
      tecnico: tecnico || undefined,
      optimizarProximidad,
      maxGeocode: 12,
    })
    return NextResponse.json(ruta)
  } catch (error) {
    console.error("[GET /api/fumigacion/ruta]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al armar la ruta" },
      { status: 500 },
    )
  }
}
