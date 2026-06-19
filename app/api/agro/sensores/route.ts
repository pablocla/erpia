import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { addSensor, ensureIoTSeeds, findSensorByDeviceEUI, listLecturas, listSensors } from "@/lib/agro/iot-stub-store"

const createSensorSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum([
    "HUMEDAD_SUELO",
    "TEMPERATURA_SUELO",
    "TEMPERATURA_AIRE",
    "CAUDAL_RIEGO",
    "PRESION_AGUA",
    "LLUVIA",
    "VIENTO",
  ]),
  deviceEUI: z.string().min(1),
  loteId: z.coerce.number().int().positive(),
  lat: z.union([z.coerce.number(), z.null()]).optional(),
  lon: z.union([z.coerce.number(), z.null()]).optional(),
})

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const loteIdParam = searchParams.get("loteId")
  const loteId = loteIdParam ? Number(loteIdParam) : undefined
  if (loteIdParam && (!Number.isInteger(loteId) || loteId <= 0)) {
    return NextResponse.json({ error: "loteId inválido" }, { status: 400 })
  }

  const lotes = await prisma.agroLote.findMany({
    where: { ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: { id: true },
    orderBy: { id: "asc" },
    take: 10,
  })
  ensureIoTSeeds(auth.auth.empresaId, lotes.map((l) => l.id))

  const sensores = listSensors(auth.auth.empresaId, loteId).map((s) => {
    const ult = listLecturas(s.id, auth.auth.empresaId, 9999, 1)[0] ?? null
    return { ...s, ultimaLectura: ult }
  })

  return NextResponse.json({ sensores })
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = createSensorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { nombre, tipo, deviceEUI, loteId, lat, lon } = parsed.data
  const deviceEuiTrimmed = deviceEUI.trim()

  const lote = await prisma.agroLote.findFirst({
    where: { id: loteId, ...whereEmpresa(auth.auth.empresaId), activo: true },
    select: { id: true },
  })
  if (!lote) {
    return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 })
  }

  const existingSensor = findSensorByDeviceEUI(deviceEuiTrimmed, auth.auth.empresaId)
  if (existingSensor) {
    return NextResponse.json({ error: "deviceEUI ya registrado" }, { status: 409 })
  }

  const sensor = addSensor({
    nombre: String(nombre).trim(),
    tipo,
    deviceEUI: deviceEuiTrimmed,
    loteId: Number(loteId),
    empresaId: auth.auth.empresaId,
    lat: lat == null ? null : Number(lat),
    lon: lon == null ? null : Number(lon),
    activo: true,
  })

  return NextResponse.json(sensor, { status: 201 })
}
