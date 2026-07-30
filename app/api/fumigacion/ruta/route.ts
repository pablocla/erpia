import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getRutaFumigacionDia } from "@/lib/fumigacion/fumigacion-ruta-service"
import { arrayToCsv } from "@/lib/utils/export-csv"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const fechaRaw = searchParams.get("fecha")
  const tecnico = searchParams.get("tecnico") ?? undefined
  const optimizarProximidad = searchParams.get("optimizarProximidad") === "true"
  const formatoExportacion = searchParams.get("export")

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

    if (formatoExportacion === "csv") {
      const flatData = ruta.paradas.map(p => ({
        Orden: p.orden,
        Estado: p.estado,
        Cliente: p.clienteNombre,
        Direccion: p.direccion || "Sin dirección",
        Telefono: p.telefono || "-",
        Plaga: p.plagaLabel,
        Servicio: p.tipoServicioLabel,
        MontoCobrado: p.montoCobrado || 0,
        EstadoPago: p.estadoPago || "-",
        Observaciones: p.observacionesVisita || "-",
        Tecnico: p.tecnicoAsignado || "Sin asignar"
      }))
      
      const csv = arrayToCsv(flatData)
      const fechaStr = fechaRaw || new Date().toISOString().slice(0,10)
      
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ruta-fumigacion-${fechaStr}.csv"`,
        },
      })
    }

    return NextResponse.json(ruta)
  } catch (error) {
    console.error("[GET /api/fumigacion/ruta]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al armar la ruta" },
      { status: 500 },
    )
  }
}
