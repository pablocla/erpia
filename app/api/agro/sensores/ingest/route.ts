import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { addLectura, findSensorByDeviceEUI } from "@/lib/agro/iot-stub-store"

const ingestSchema = z.object({
  deviceEUI: z.string().min(1),
  valor: z.coerce.number(),
  unidad: z.string().min(1),
  timestamp: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = ingestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { deviceEUI, valor, unidad, timestamp } = parsed.data

  const sensor = findSensorByDeviceEUI(String(deviceEUI), auth.auth.empresaId)
  if (!sensor) {
    return NextResponse.json({ error: "Sensor no encontrado" }, { status: 404 })
  }

  const lectura = addLectura({
    sensorId: sensor.id,
    valor: Number(valor),
    unidad: String(unidad),
    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    empresaId: auth.auth.empresaId,
  })

  const alerta = sensor.tipo === "HUMEDAD_SUELO" && lectura.valor < 15

  return NextResponse.json({
    sensorId: sensor.id,
    lecturaId: lectura.id,
    alerta,
    mensaje: alerta ? "Humedad de suelo por debajo del umbral" : "OK",
  })
}
