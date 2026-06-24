import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listLecturas, listSensors, listZonas } from "@/lib/agro/iot-stub-store"

const recomendarSchema = z.object({
  loteId: z.coerce.number().int().positive(),
  zonaRiegoId: z.coerce.number().int().positive(),
})

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = recomendarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { loteId, zonaRiegoId } = parsed.data

  const zona = listZonas(auth.auth.empresaId, loteId).find((z) => z.id === zonaRiegoId)
  if (!zona) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 })

  // Heurística local para no depender de credenciales externas en esta fase.
  const sensoresHumedad = listSensors(auth.auth.empresaId, loteId).filter((s) => s.tipo === "HUMEDAD_SUELO")
  const lecturasHumedad = sensoresHumedad.flatMap((s) => listLecturas(s.id, auth.auth.empresaId, 24, 24)).filter((l) => l.unidad === "%")
  const humedadMedia = lecturasHumedad.length
    ? lecturasHumedad.reduce((s, l) => s + l.valor, 0) / lecturasHumedad.length
    : 20

  const debeRegar = humedadMedia < 18
  const volumenLitros = debeRegar ? Math.round((zona.caudal ?? 8000) * 0.45) : 0

  return NextResponse.json({
    loteId,
    zonaRiegoId,
    debeRegar,
    volumenLitros,
    razon: debeRegar
      ? `Humedad media ${humedadMedia.toFixed(1)}%, por debajo del umbral de 18%.`
      : `Humedad media ${humedadMedia.toFixed(1)}%, dentro de rango operativo.`,
    proximoCheckHoras: debeRegar ? 6 : 12,
    riesgoHelada: false,
    alertas: debeRegar ? ["Humedad baja en perfil superficial"] : [],
    provider: "heuristica_local",
  })
}

