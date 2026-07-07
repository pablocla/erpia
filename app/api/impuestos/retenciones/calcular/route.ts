import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  calcularRetencionesCobroSufridas,
  calcularRetencionesPago,
} from "@/lib/impuestos/retencion-calculo-service"

const schema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("cobro"),
    clienteId: z.number().int().positive(),
    montoBase: z.number().positive(),
  }),
  z.object({
    tipo: z.literal("pago"),
    proveedorId: z.number().int().positive(),
    montoBase: z.number().positive(),
    jurisdiccionIIBB: z.string().optional(),
  }),
])

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const result =
    data.tipo === "cobro"
      ? await calcularRetencionesCobroSufridas({
          empresaId: ctx.auth.empresaId,
          clienteId: data.clienteId,
          montoBase: data.montoBase,
        })
      : await calcularRetencionesPago({
          empresaId: ctx.auth.empresaId,
          proveedorId: data.proveedorId,
          montoBase: data.montoBase,
          jurisdiccion: data.jurisdiccionIIBB,
        })

  return NextResponse.json(result)
}