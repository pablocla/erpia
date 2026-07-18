import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { submitVentasConsulta } from "@/lib/comercial/ventas-consulta-service"
import { VENTAS_CONSULTA_TIPOS } from "@/lib/comercial/ventas-consulta-catalog"

const bodySchema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email().max(200),
  telefono: z.string().max(40).optional(),
  negocio: z.string().max(120).optional(),
  rubro: z.string().max(80).optional(),
  mensaje: z.string().max(2000).optional(),
  tipo: z.enum(VENTAS_CONSULTA_TIPOS).optional(),
  pagina: z.string().max(200).optional(),
  website: z.string().max(0).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const lead = await submitVentasConsulta(parsed.data)
    return NextResponse.json(
      { ok: true, id: lead.id, mensaje: "Consulta recibida. Te contactamos en menos de 24 h hábiles." },
      { status: 201 },
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    if (msg === "Solicitud rechazada") {
      return NextResponse.json({ ok: true, mensaje: "Recibido" }, { status: 201 })
    }
    if (msg.includes("obligatorios") || msg.includes("inválido")) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    console.error("Error en consulta comercial web:", error)
    return NextResponse.json({ error: "No se pudo registrar la consulta" }, { status: 500 })
  }
}