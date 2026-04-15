import { type NextRequest, NextResponse } from "next/server"
import { SICOREService, type CrearRetencionInput } from "@/lib/impuestos/sicore-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const crearRetencionSchema = z.object({
  tipo: z.enum(["IVA", "ganancias"]),
  codigoSicore: z.enum(["217", "219", "305", "767", "779"]),
  base: z.number().positive(),
  alicuota: z.number().positive(),
  monto: z.number().positive(),
  compraId: z.number().int().optional(),
  proveedorId: z.number().int().optional(),
  fechaRetencion: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const empresaId = ctx.auth.empresaId

    const params = request.nextUrl.searchParams
    const mes = params.get("mes")
    const anio = params.get("anio")
    const formato = params.get("formato")

    const service = new SICOREService()

    // Generate SIAP-compatible export file
    if (formato === "siap") {
      if (!mes || !anio) {
        return NextResponse.json({ error: "mes y anio son requeridos para exportar" }, { status: 400 })
      }
      const archivo = await service.generarArchivoSICORE(Number(mes), Number(anio), empresaId)
      return new NextResponse(archivo, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="sicore_${anio}_${String(mes).padStart(2, "0")}.txt"`,
        },
      })
    }

    const filtros: Record<string, unknown> = { empresaId }
    if (mes) filtros.mes = Number(mes)
    if (anio) filtros.anio = Number(anio)
    if (params.get("tipo")) filtros.tipo = params.get("tipo")
    if (params.get("estado")) filtros.estado = params.get("estado")
    if (params.get("proveedorId")) filtros.proveedorId = Number(params.get("proveedorId"))

    const retenciones = await service.listarRetenciones(filtros as Parameters<SICOREService["listarRetenciones"]>[0])

    // Optionally include period totals when mes+anio are provided
    let totales = null
    if (mes && anio) {
      totales = await service.totalesPorPeriodo(Number(mes), Number(anio), empresaId)
    }

    return NextResponse.json({ success: true, retenciones, totales })
  } catch (error) {
    console.error("Error en GET /api/impuestos/sicore:", error)
    return NextResponse.json({ error: "Error al obtener retenciones SICORE" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    // Only administrators and accountants can register withholdings
    if (!ctx.auth.rol || !["administrador", "contador"].includes(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos para registrar retenciones" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = crearRetencionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const input: CrearRetencionInput = {
      ...parsed.data,
      empresaId: ctx.auth.empresaId,
      fechaRetencion: parsed.data.fechaRetencion ? new Date(parsed.data.fechaRetencion) : undefined,
    }

    const service = new SICOREService()
    const retencion = await service.registrarRetencion(input)

    return NextResponse.json({ success: true, retencion }, { status: 201 })
  } catch (error) {
    console.error("Error en POST /api/impuestos/sicore:", error)
    return NextResponse.json({ error: "Error al registrar retención SICORE" }, { status: 500 })
  }
}
