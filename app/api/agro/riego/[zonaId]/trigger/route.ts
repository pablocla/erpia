import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { closeEvento, createEvento, findZona } from "@/lib/agro/iot-stub-store"

const triggerSchema = z.object({
  accion: z.preprocess(
    (value) => (typeof value === "string" ? value.toUpperCase() : value),
    z.enum(["INICIAR", "DETENER"])
  ),
  operadorId: z.union([z.coerce.number().int(), z.null()]).optional(),
})

interface Params {
  params: Promise<{ zonaId: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { zonaId } = await params
  const id = Number(zonaId)
  if (!id) return NextResponse.json({ error: "zonaId inválido" }, { status: 400 })

  const zona = findZona(id, auth.auth.empresaId)
  if (!zona) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 })

  const body = await request.json()
  const parsed = triggerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { accion, operadorId } = parsed.data

  if (accion === "INICIAR") {
    zona.activa = true
    const evento = createEvento({
      zonaId: zona.id,
      inicio: new Date().toISOString(),
      fin: null,
      duracionMin: null,
      volumenLitros: null,
      trigger: "MANUAL",
      operadorId: operadorId == null ? null : Number(operadorId),
      empresaId: auth.auth.empresaId,
    })
    return NextResponse.json({ ok: true, accion, zona, evento, actuador: "stub" })
  }

  if (accion === "DETENER") {
    zona.activa = false
    const evento = closeEvento(zona.id, auth.auth.empresaId)
    if (!evento) {
      return NextResponse.json(
        { ok: false, error: "No hay evento de riego abierto para esta zona", accion, zona, actuador: "stub" },
        { status: 409 }
      )
    }
    return NextResponse.json({ ok: true, accion, zona, evento, actuador: "stub" })
  }

  return NextResponse.json({ error: "accion debe ser INICIAR o DETENER" }, { status: 400 })
}
