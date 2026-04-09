import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { periodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"
import { z } from "zod"

const cierreSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
  observaciones: z.string().optional(),
})

const reabrirSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
})

// ─── GET — List fiscal periods for the empresa ───────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const anio = searchParams.get("anio")
    const empresaId = (usuario as any).empresaId ?? 1

    if (anio) {
      const meses = await periodoFiscalService.getAnioCompleto(empresaId, parseInt(anio, 10))
      return NextResponse.json({ anio: parseInt(anio, 10), meses })
    }

    const periodos = await periodoFiscalService.listarPeriodos(empresaId)
    return NextResponse.json({ periodos })
  } catch (error: any) {
    console.error("Error en GET periodos-fiscales:", error)
    return NextResponse.json({ error: error?.message ?? "Error interno" }, { status: 500 })
  }
}

// ─── POST — Close a fiscal period ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    // Only admin/contador can close periods
    const rol = (usuario as any).rol
    if (!["administrador", "contador", "dueno"].includes(rol)) {
      return NextResponse.json({ error: "Solo administrador o contador puede cerrar períodos" }, { status: 403 })
    }

    const body = await request.json()
    const validacion = cierreSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { mes, anio, observaciones } = validacion.data
    const empresaId = (usuario as any).empresaId ?? 1
    const usuarioId = (usuario as any).id ?? 1

    const result = await periodoFiscalService.cerrarPeriodo(mes, anio, empresaId, usuarioId, observaciones)
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error("Error al cerrar período:", error)
    const message = error?.message ?? "Error interno"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// ─── PATCH — Reopen a closed period ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const rol = (usuario as any).rol
    if (!["administrador", "dueno"].includes(rol)) {
      return NextResponse.json({ error: "Solo administrador puede reabrir períodos" }, { status: 403 })
    }

    const body = await request.json()
    const validacion = reabrirSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { mes, anio } = validacion.data
    const empresaId = (usuario as any).empresaId ?? 1
    const usuarioId = (usuario as any).id ?? 1

    const result = await periodoFiscalService.reabrirPeriodo(mes, anio, empresaId, usuarioId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error al reabrir período:", error)
    return NextResponse.json({ error: error?.message ?? "Error interno" }, { status: 400 })
  }
}
