import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { presupuestoService } from "@/lib/ventas/presupuesto-service"
import { z } from "zod"

const lineaSchema = z.object({
  productoId: z.number().int().positive().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
  descuentoPct: z.number().min(0).max(100).optional(),
})

const crearSchema = z.object({
  clienteId: z.number().int().positive(),
  vendedorId: z.number().int().positive().optional(),
  listaPrecioId: z.number().int().positive().optional(),
  condicionPagoId: z.number().int().positive().optional(),
  fechaVencimiento: z.string().optional(),
  descuentoPct: z.number().min(0).max(100).optional(),
  observaciones: z.string().optional(),
  lineas: z.array(lineaSchema).min(1),
})

const actionSchema = z.object({
  action: z.enum(["enviar", "aceptar", "rechazar", "convertir", "duplicar"]),
  presupuestoId: z.number().int().positive(),
})

// ─── GET — List presupuestos ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const pres = await presupuestoService.obtener(parseInt(id, 10))
      if (!pres) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
      return NextResponse.json(pres)
    }

    const clienteId = searchParams.get("clienteId")
    const estado = searchParams.get("estado")
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "20", 10)

    const result = await presupuestoService.listar({
      clienteId: clienteId ? parseInt(clienteId, 10) : undefined,
      estado: estado ?? undefined,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al listar presupuestos:", error)
    logError("api/ventas/presupuestos:GET", error, request)
    return NextResponse.json({ error: "Error al listar presupuestos" }, { status: 500 })
  }
}

// ─── POST — Create presupuesto OR execute action ────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    // Check if it's an action on existing presupuesto
    const actionResult = actionSchema.safeParse(body)
    if (actionResult.success) {
      const { action, presupuestoId } = actionResult.data
      let result: any

      switch (action) {
        case "enviar":
          result = await presupuestoService.enviar(presupuestoId)
          break
        case "aceptar":
          result = await presupuestoService.aceptar(presupuestoId)
          break
        case "rechazar":
          result = await presupuestoService.rechazar(presupuestoId)
          break
        case "convertir":
          result = await presupuestoService.convertirAPedido(presupuestoId)
          break
        case "duplicar":
          result = await presupuestoService.duplicar(presupuestoId)
          break
      }

      return NextResponse.json(result, { status: 200 })
    }

    // Otherwise create new presupuesto
    const validacion = crearSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const presupuesto = await presupuestoService.crear({ ...validacion.data, empresaId: ctx.auth.empresaId })
    return NextResponse.json(presupuesto, { status: 201 })
  } catch (error: any) {
    console.error("Error en presupuestos:", error)
    return NextResponse.json({ error: error.message ?? "Error interno" }, { status: 500 })
  }
}
