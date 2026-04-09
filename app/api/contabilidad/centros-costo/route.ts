import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
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

// ─── GET — List centros de costo (tree or flat) ─────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const vista = searchParams.get("vista")

    if (vista === "jerarquia") {
      const tree = await centroCostoService.listarJerarquia()
      return NextResponse.json(tree)
    }

    const flat = await centroCostoService.listarPlano()
    return NextResponse.json(flat)
  } catch (error) {
    console.error("Error al listar centros de costo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Create centro or run report ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()

    // Report action
    const reporteResult = reporteSchema.safeParse(body)
    if (reporteResult.success) {
      const data = await centroCostoService.reportePorPeriodo(reporteResult.data.mes, reporteResult.data.anio)
      return NextResponse.json(data)
    }

    // Create
    const validacion = crearSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const cc = await centroCostoService.crear(validacion.data)
    return NextResponse.json(cc, { status: 201 })
  } catch (error: any) {
    console.error("Error en centros de costo:", error)
    return NextResponse.json({ error: error.message ?? "Error interno" }, { status: 500 })
  }
}

// ─── PATCH — Update centro ──────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const cc = await centroCostoService.actualizar(id, data)
    return NextResponse.json(cc)
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error interno" }, { status: 500 })
  }
}

// ─── DELETE — Deactivate centro ─────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    await centroCostoService.desactivar(parseInt(id, 10))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error interno" }, { status: 500 })
  }
}
