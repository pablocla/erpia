import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { cotizacionService } from "@/lib/config/cotizacion-service"
import { z } from "zod"

const registrarSchema = z.object({
  monedaId: z.number().int().positive(),
  fecha: z.string(),
  tipo: z.enum(["oficial", "mep", "ccl", "blue", "tarjeta"]).optional(),
  valorArs: z.number().positive(),
  fuente: z.string().optional(),
})

const convertirSchema = z.object({
  action: z.literal("convertir"),
  monto: z.number(),
  monedaId: z.number().int().positive(),
  tipo: z.string().optional(),
  direccion: z.enum(["a_ars", "desde_ars"]).optional(),
})

const fetchSchema = z.object({
  action: z.literal("fetch_bna"),
})

// ─── GET — List cotizaciones ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const monedaId = searchParams.get("monedaId")
    const vista = searchParams.get("vista")

    if (vista === "monedas") {
      const monedas = await cotizacionService.listarMonedas()
      return NextResponse.json(monedas)
    }

    if (monedaId) {
      const cotizaciones = await cotizacionService.listarPorMoneda(parseInt(monedaId, 10))
      return NextResponse.json(cotizaciones)
    }

    const ultimas = await cotizacionService.listarUltimas()
    return NextResponse.json(ultimas)
  } catch (error) {
    console.error("Error al listar cotizaciones:", error)
    return NextResponse.json({ error: "Error al listar cotizaciones" }, { status: 500 })
  }
}

// ─── POST — Register rate, convert, or fetch ────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()

    // Fetch BNA
    const fetchResult = fetchSchema.safeParse(body)
    if (fetchResult.success) {
      const rates = await cotizacionService.fetchDolarBNA()
      if (!rates) return NextResponse.json({ error: "No se pudo obtener cotización BNA" }, { status: 502 })
      return NextResponse.json({ message: "Cotización actualizada", rates })
    }

    // Convert
    const convertResult = convertirSchema.safeParse(body)
    if (convertResult.success) {
      const { monto, monedaId, tipo, direccion } = convertResult.data
      if (direccion === "desde_ars") {
        const result = await cotizacionService.convertirDesdeARS(monto, monedaId, tipo)
        return NextResponse.json(result)
      }
      const result = await cotizacionService.convertirARS(monto, monedaId, tipo)
      return NextResponse.json(result)
    }

    // Register rate
    const validacion = registrarSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const cotizacion = await cotizacionService.registrar(validacion.data)
    return NextResponse.json(cotizacion, { status: 201 })
  } catch (error: any) {
    console.error("Error en cotizaciones:", error)
    return NextResponse.json({ error: error.message ?? "Error interno" }, { status: 500 })
  }
}
