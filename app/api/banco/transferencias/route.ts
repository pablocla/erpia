import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { transferenciasService } from "@/lib/banco/transferencias-service"
import { z } from "zod"

const transferSchema = z.object({
  cuentaOrigenId: z.number().int().positive(),
  cuentaDestinoId: z.number().int().positive(),
  importe: z.number().positive(),
  fecha: z.string().optional(),
  descripcion: z.string().optional(),
  referencia: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = transferSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { cuentaOrigenId, cuentaDestinoId, importe, fecha, descripcion, referencia } = validacion.data

    const result = await transferenciasService.transferir({
      empresaId: ctx.auth.empresaId,
      cuentaOrigenId,
      cuentaDestinoId,
      importe,
      fecha: fecha ? new Date(fecha) : undefined,
      descripcion,
      referencia,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    const message = error?.message ?? "Error interno"
    const status = message.includes("no encontrada") || message.includes("empresa") || message.includes("iguales") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
