import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { conciliacionService } from "@/lib/banco/conciliacion-service"
import { z } from "zod"

// ─── PATCH — Conciliar movimiento(s) manualmente ────────────────────────────

const conciliarSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, "Debe seleccionar al menos un movimiento"),
})

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = conciliarSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const count = await conciliacionService.conciliarManual(validacion.data.ids, ctx.auth.empresaId)
    return NextResponse.json({ conciliados: count })
  } catch (error) {
    console.error("Error al conciliar:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Auto-reconciliation with bank statement CSV ──────────────────────

const reconciliarSchema = z.object({
  cuentaBancariaId: z.number().int().positive(),
  extractoCSV: z.string().min(10, "El extracto está vacío"),
  periodo: z.string().optional(), // "MM/YYYY"
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = reconciliarSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.flatten() }, { status: 400 })
    }

    const { cuentaBancariaId, extractoCSV, periodo } = validacion.data

    const report = await conciliacionService.reconciliar(
      cuentaBancariaId,
      ctx.auth.empresaId,
      extractoCSV,
      periodo,
    )

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error en reconciliación:", error)
    return NextResponse.json({ error: "Error en reconciliación" }, { status: 500 })
  }
}

// ─── GET — Reconciliation summary for a bank account ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const cuentaBancariaId = searchParams.get("cuentaBancariaId")

    if (!cuentaBancariaId) {
      return NextResponse.json({ error: "cuentaBancariaId requerido" }, { status: 400 })
    }

    const resumen = await conciliacionService.getResumen(
      parseInt(cuentaBancariaId, 10),
      ctx.auth.empresaId,
    )

    return NextResponse.json(resumen)
  } catch (error) {
    console.error("Error al obtener resumen conciliación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
