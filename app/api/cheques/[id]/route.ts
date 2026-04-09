import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const patchSchema = z.object({
  estado: z.enum(["cartera", "depositado", "endosado", "rechazado", "debitado", "anulado"]).optional(),
  observaciones: z.string().optional(),
  cuentaDepositoId: z.number().int().positive().optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const cheque = await prisma.cheque.update({
      where: { id: parseInt(id) },
      data: {
        estado: parsed.data.estado,
        observaciones: parsed.data.observaciones,
        cuentaDepositoId: parsed.data.cuentaDepositoId,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ ...cheque, monto: Number(cheque.monto) })
  } catch (error) {
    console.error("cheques PATCH:", error)
    return NextResponse.json({ error: "Error al actualizar cheque" }, { status: 500 })
  }
}
