import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { centroCostoService } from "@/lib/contabilidad/centro-costo-service"
import { z } from "zod"

const crearSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  parentId: z.number().int().positive().optional(),
})

const reporteSchema = z.object({
  action: z.literal("reporte"),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2050),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const vista = searchParams.get("vista")
    const empresaId = ctx.auth.empresaId

    if (vista === "jerarquia") {
      const tree = await centroCostoService.listarJerarquia(empresaId)
      return NextResponse.json(tree)
    }

    const flat = await centroCostoService.listarPlano(empresaId)
    return NextResponse.json(flat)
  } catch (error) {
    console.error("Error al listar centros de costo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const empresaId = ctx.auth.empresaId

    const reporteResult = reporteSchema.safeParse(body)
    if (reporteResult.success) {
      const data = await centroCostoService.reportePorPeriodo(
        empresaId,
        reporteResult.data.mes,
        reporteResult.data.anio,
      )
      return NextResponse.json(data)
    }

    const validacion = crearSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const cc = await centroCostoService.crear({ ...validacion.data, empresaId })
    return NextResponse.json(cc, { status: 201 })
  } catch (error: unknown) {
    console.error("Error en centros de costo:", error)
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const cc = await centroCostoService.actualizar(ctx.auth.empresaId, id, data)
    return NextResponse.json(cc)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    await centroCostoService.desactivar(ctx.auth.empresaId, parseInt(id, 10))
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}