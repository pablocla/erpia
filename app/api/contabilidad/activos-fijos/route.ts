import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { activoFijoService } from "@/lib/contabilidad/activo-fijo-service"
import { z } from "zod"

const crearSchema = z.object({
  descripcion: z.string().min(1),
  categoria: z.enum(["vehiculo", "mueble_utensilio", "maquinaria", "inmueble", "hardware", "intangible"]).optional(),
  fechaCompra: z.string(),
  valorCompra: z.number().positive(),
  valorResidual: z.number().min(0).optional(),
  vidaUtilMeses: z.number().int().positive().optional(),
  identificador: z.string().optional(),
  observaciones: z.string().optional(),
  cuentaActivoCodigo: z.string().optional(),
  cuentaAmortizacionCodigo: z.string().optional(),
})

const depreciacionSchema = z.object({
  action: z.literal("depreciar"),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2050),
})

const bajaSchema = z.object({
  action: z.literal("baja"),
  activoId: z.number().int().positive(),
  motivo: z.string().optional(),
})

const cuadroSchema = z.object({
  action: z.literal("cuadro"),
  activoId: z.number().int().positive(),
})

// ─── GET — List activos fijos ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const activo = await activoFijoService.obtener(parseInt(id, 10))
      if (!activo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

      // Include depreciation info
      const info = activoFijoService.calcularAmortizacionAcumulada(
        activo.fechaCompra,
        Number(activo.valorCompra),
        Number(activo.valorResidual),
        activo.vidaUtilMeses
      )

      return NextResponse.json({ ...activo, ...info })
    }

    const categoria = searchParams.get("categoria") ?? undefined
    const estado = searchParams.get("estado") ?? undefined
    const activos = await activoFijoService.listar(1, { categoria, estado })

    // Enrich with current depreciation info
    const enriquecidos = activos.map(a => {
      const info = activoFijoService.calcularAmortizacionAcumulada(
        a.fechaCompra,
        Number(a.valorCompra),
        Number(a.valorResidual),
        a.vidaUtilMeses
      )
      return { ...a, ...info }
    })

    return NextResponse.json(enriquecidos)
  } catch (error) {
    console.error("Error al listar activos fijos:", error)
    return NextResponse.json({ error: "Error al listar activos fijos" }, { status: 500 })
  }
}

// ─── POST — Create activo OR execute action ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()

    // Check actions
    const depResult = depreciacionSchema.safeParse(body)
    if (depResult.success) {
      const result = await activoFijoService.correrDepreciacionMensual(depResult.data.mes, depResult.data.anio)
      return NextResponse.json(result)
    }

    const bajaResult = bajaSchema.safeParse(body)
    if (bajaResult.success) {
      const result = await activoFijoService.darDeBaja(bajaResult.data.activoId, bajaResult.data.motivo)
      return NextResponse.json(result)
    }

    const cuadroResult = cuadroSchema.safeParse(body)
    if (cuadroResult.success) {
      const activo = await activoFijoService.obtener(cuadroResult.data.activoId)
      if (!activo) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 })
      const cuadro = activoFijoService.generarCuadroAmortizacion(
        Number(activo.valorCompra),
        Number(activo.valorResidual),
        activo.vidaUtilMeses,
        activo.fechaCompra
      )
      return NextResponse.json({ activo, cuadro })
    }

    // Create new activo fijo
    const validacion = crearSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const activo = await activoFijoService.crear(validacion.data)
    return NextResponse.json(activo, { status: 201 })
  } catch (error: any) {
    console.error("Error en activos fijos:", error)
    return NextResponse.json({ error: error.message ?? "Error interno" }, { status: 500 })
  }
}
