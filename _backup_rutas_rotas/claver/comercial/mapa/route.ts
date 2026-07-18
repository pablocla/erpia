import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getMapaCampoPins } from "@/lib/ops/mapa-campo-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const rubro = request.nextUrl.searchParams.get("rubro") ?? undefined
    const maxGeocode = Number(request.nextUrl.searchParams.get("maxGeocode") ?? 8)

    const result = await getMapaCampoPins({
      rubro: rubro || undefined,
      maxGeocode: Number.isFinite(maxGeocode) ? maxGeocode : 8,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error mapa campo:", error)
    return NextResponse.json(
      { error: "No se pudo cargar el mapa. ¿Corriste db push para coordenadas?" },
      { status: 500 },
    )
  }
}