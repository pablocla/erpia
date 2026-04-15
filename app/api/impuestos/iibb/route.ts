import { type NextRequest, NextResponse } from "next/server"
import { IIBBService } from "@/lib/impuestos/iibb-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const cerrarPeriodoSchema = z.object({
  accion: z.enum(["cerrar", "presentado"]),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020),
  jurisdiccion: z.string().min(2).max(6),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const empresaId = ctx.auth.empresaId

    const params = request.nextUrl.searchParams
    const mes = params.get("mes")
    const anio = params.get("anio")
    const jurisdiccion = params.get("jurisdiccion") ?? undefined
    const formato = params.get("formato")

    const service = new IIBBService()

    // Generate DDJJ text file
    if (formato === "ddjj") {
      if (!mes || !anio) {
        return NextResponse.json({ error: "mes y anio son requeridos para DDJJ" }, { status: 400 })
      }
      const ddjj = await service.generarDDJJ(Number(mes), Number(anio))
      return new NextResponse(ddjj, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="iibb_ddjj_${anio}_${String(mes).padStart(2, "0")}.txt"`,
        },
      })
    }

    // Annual evolution series
    if (!mes && anio) {
      const evolucion = await service.getEvolucionAnual(Number(anio), jurisdiccion, empresaId)
      return NextResponse.json({ success: true, evolucion })
    }

    // Period liquidation (default)
    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const liquidacion = await service.getLiquidacion(Number(mes), Number(anio), jurisdiccion, empresaId)
    return NextResponse.json({ success: true, liquidacion })
  } catch (error) {
    console.error("Error en GET /api/impuestos/iibb:", error)
    return NextResponse.json({ error: "Error al obtener datos IIBB" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!ctx.auth.rol || !["administrador", "contador"].includes(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos para cerrar períodos IIBB" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = cerrarPeriodoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { accion, mes, anio, jurisdiccion } = parsed.data
    const service = new IIBBService()

    if (accion === "cerrar") {
      await service.cerrarPeriodo(mes, anio, jurisdiccion)
      return NextResponse.json({ success: true, mensaje: `Período IIBB ${mes}/${anio} - ${jurisdiccion} cerrado` })
    }

    if (accion === "presentado") {
      await service.marcarPresentado(mes, anio, jurisdiccion)
      return NextResponse.json({ success: true, mensaje: `Período IIBB ${mes}/${anio} - ${jurisdiccion} marcado como presentado` })
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 })
  } catch (error) {
    console.error("Error en POST /api/impuestos/iibb:", error)
    return NextResponse.json({ error: "Error al actualizar período IIBB" }, { status: 500 })
  }
}
