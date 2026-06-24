import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { findSensor, listLecturas } from "@/lib/agro/iot-stub-store"

interface Params {
  params: Promise<{ sensorId: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { sensorId } = await params
  const id = Number(sensorId)
  if (!id) return NextResponse.json({ error: "sensorId inválido" }, { status: 400 })

  const sensor = findSensor(id, auth.auth.empresaId)
  if (!sensor) return NextResponse.json({ error: "Sensor no encontrado" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const hours = Number(searchParams.get("hours") ?? 24)
  const limit = Number(searchParams.get("limit") ?? 100)

  const lecturas = listLecturas(id, auth.auth.empresaId, Math.max(1, hours), Math.max(1, Math.min(1000, limit)))

  return NextResponse.json({ sensor, lecturas })
}
