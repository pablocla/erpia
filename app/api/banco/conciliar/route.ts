import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── PATCH — Conciliar movimiento(s) ────────────────────────────────────────

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

    const { ids } = validacion.data

    const result = await prisma.movimientoBancario.updateMany({
      where: {
        id: { in: ids },
        estado: "pendiente",
        cuentaBancaria: { empresaId: ctx.auth.empresaId },
      },
      data: { estado: "conciliado" },
    })

    return NextResponse.json({ conciliados: result.count })
  } catch (error) {
    console.error("Error al conciliar:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
