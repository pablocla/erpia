import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { calcularPrecio, calcularPreciosLote } from "@/lib/precios/motor-precios"
import { z } from "zod"

const itemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().positive().default(1),
})

const bodySchema = z.object({
  clienteId: z.number().int().positive().optional(),
  fecha: z.string().datetime().optional(),
  items: z.array(itemSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const fecha = parsed.data.fecha ? new Date(parsed.data.fecha) : new Date()
    const { empresaId } = ctx.auth

    if (parsed.data.items.length === 1) {
      const item = parsed.data.items[0]
      const resultado = await calcularPrecio({
        productoId: item.productoId,
        clienteId: parsed.data.clienteId,
        cantidad: item.cantidad,
        fecha,
        empresaId,
      })
      return NextResponse.json({ item: { ...item, ...resultado } })
    }

    const map = await calcularPreciosLote(
      parsed.data.items,
      parsed.data.clienteId,
      fecha,
      empresaId
    )

    const items = parsed.data.items.map((item) => ({
      ...item,
      ...(map.get(item.productoId) ?? { precioFinal: 0, origen: "no_encontrado" }),
    }))

    return NextResponse.json({ items })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}