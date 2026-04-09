import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const dispositivoSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.enum(["temperatura", "humedad", "presion", "contador", "scanner", "gps", "energia", "vibracion", "flujo", "peso", "nivel"]),
  ubicacion: z.string().optional(),
  ipAddress: z.string().optional(),
  mac: z.string().optional(),
  firmware: z.string().optional(),
  // Configuración industrial
  protocolo: z.enum(["mqtt", "modbus_tcp", "modbus_rtu", "opcua", "http", "coap", "lorawan", "zigbee", "ble"]).optional(),
  endpointConfig: z.string().optional(),
  intervaloMuestreo: z.number().int().min(1).optional(),
  unidadMedida: z.string().optional(),
  rangoMin: z.number().optional(),
  rangoMax: z.number().optional(),
  umbralAlertaMin: z.number().optional(),
  umbralAlertaMax: z.number().optional(),
  umbralCriticoMin: z.number().optional(),
  umbralCriticoMax: z.number().optional(),
  precision: z.number().optional(),
  normaIndustrial: z.string().optional(),
  claseProteccion: z.enum(["IP20", "IP54", "IP65", "IP67", "IP68"]).optional(),
  zonaInstalacion: z.enum(["zona_limpia", "zona_atex", "intemperie", "camara_frio", "linea_produccion", "almacen", "sala_maquinas"]).optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  alimentacion: z.enum(["24vdc", "220vac", "bateria", "poe", "solar", "4-20ma_loop"]).optional(),
  timeoutDesconexion: z.number().int().min(10).optional(),
  offsetCalibracion: z.number().optional(),
  notasTecnicas: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || ""

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (tipo) where.tipo = tipo

    const dispositivos = await prisma.dispositivoIoT.findMany({
      where,
      include: {
        lecturas: { orderBy: { timestamp: "desc" }, take: 1 },
        alertas: { where: { resuelta: false }, orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(dispositivos)
  } catch (error) {
    console.error("Error al obtener dispositivos IoT:", error)
    logError("api/iot/dispositivos:GET", error, request)
    return NextResponse.json({ error: "Error al obtener dispositivos IoT" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = dispositivoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existente = await prisma.dispositivoIoT.findUnique({ where: { codigo: parsed.data.codigo } })
    if (existente) return NextResponse.json({ error: "Ya existe un dispositivo con ese código" }, { status: 409 })

    const dispositivo = await prisma.dispositivoIoT.create({
      data: {
        empresaId: ctx.auth.empresaId,
        codigo: parsed.data.codigo,
        nombre: parsed.data.nombre,
        tipo: parsed.data.tipo,
        ubicacion: parsed.data.ubicacion,
        ipAddress: parsed.data.ipAddress,
        mac: parsed.data.mac,
        firmware: parsed.data.firmware,
        protocolo: parsed.data.protocolo,
        endpointConfig: parsed.data.endpointConfig,
        intervaloMuestreo: parsed.data.intervaloMuestreo,
        unidadMedida: parsed.data.unidadMedida,
        rangoMin: parsed.data.rangoMin,
        rangoMax: parsed.data.rangoMax,
        umbralAlertaMin: parsed.data.umbralAlertaMin,
        umbralAlertaMax: parsed.data.umbralAlertaMax,
        umbralCriticoMin: parsed.data.umbralCriticoMin,
        umbralCriticoMax: parsed.data.umbralCriticoMax,
        precision: parsed.data.precision,
        normaIndustrial: parsed.data.normaIndustrial,
        claseProteccion: parsed.data.claseProteccion,
        zonaInstalacion: parsed.data.zonaInstalacion,
        marca: parsed.data.marca,
        modelo: parsed.data.modelo,
        numeroSerie: parsed.data.numeroSerie,
        alimentacion: parsed.data.alimentacion,
        timeoutDesconexion: parsed.data.timeoutDesconexion,
        offsetCalibracion: parsed.data.offsetCalibracion,
        notasTecnicas: parsed.data.notasTecnicas,
      },
    })

    return NextResponse.json(dispositivo, { status: 201 })
  } catch (error) {
    console.error("Error al crear dispositivo IoT:", error)
    logError("api/iot/dispositivos:POST", error, request)
    return NextResponse.json({ error: "Error al crear dispositivo IoT" }, { status: 500 })
  }
}
