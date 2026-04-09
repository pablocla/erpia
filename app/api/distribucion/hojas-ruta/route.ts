import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const paradaSchema = z.object({
  envioId: z.number().int().positive().optional().nullable(),
  direccion: z.string().min(1).optional(),
  localidad: z.string().optional(),
  ventanaDesde: z.string().optional().nullable(),
  ventanaHasta: z.string().optional().nullable(),
  contactoNombre: z.string().optional(),
  contactoTelefono: z.string().optional(),
  observaciones: z.string().optional(),
})

const hojaRutaSchema = z.object({
  fecha: z.string().min(1),
  vehiculoId: z.number().int().positive().optional().nullable(),
  choferId: z.number().int().positive().optional().nullable(),
  kmEstimado: z.number().positive().optional().nullable(),
  observaciones: z.string().optional(),
  paradas: z.array(paradaSchema).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") || ""
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (estado) where.estado = estado
    if (desde || hasta) {
      const rango: Record<string, Date> = {}
      if (desde) rango.gte = new Date(desde)
      if (hasta) rango.lte = new Date(hasta)
      where.fecha = rango
    }

    const hojas = await prisma.hojaRuta.findMany({
      where,
      include: {
        vehiculo: true,
        chofer: true,
        paradas: { select: { id: true, estado: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(hojas)
  } catch (error) {
    console.error("Error al listar hojas de ruta:", error)
    logError("api/distribucion/hojas-ruta:GET", error, request)
    return NextResponse.json({ error: "Error al listar hojas de ruta" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = hojaRutaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const fecha = new Date(parsed.data.fecha)
    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json({ error: "Fecha invalida" }, { status: 400 })
    }

    if (parsed.data.vehiculoId) {
      const vehiculo = await prisma.vehiculo.findFirst({
        where: { id: parsed.data.vehiculoId, empresaId: ctx.auth.empresaId },
        select: { id: true },
      })
      if (!vehiculo) return NextResponse.json({ error: "Vehiculo no encontrado" }, { status: 404 })
    }

    if (parsed.data.choferId) {
      const chofer = await prisma.chofer.findFirst({
        where: { id: parsed.data.choferId, empresaId: ctx.auth.empresaId },
        select: { id: true },
      })
      if (!chofer) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
    }

    const enviosIds = parsed.data.paradas
      .map((p) => p.envioId)
      .filter((id): id is number => Boolean(id))

    const envios = enviosIds.length
      ? await prisma.envio.findMany({
          where: { id: { in: enviosIds }, empresaId: ctx.auth.empresaId },
          include: { remito: { select: { clienteId: true } } },
        })
      : []

    const enviosMap = new Map(envios.map((e) => [e.id, e]))
    if (enviosIds.length && envios.length !== enviosIds.length) {
      return NextResponse.json({ error: "Envio no encontrado" }, { status: 404 })
    }

    const paradasData: Prisma.ParadaRutaUncheckedCreateWithoutHojaRutaInput[] = []
    for (const [index, parada] of parsed.data.paradas.entries()) {
      const envio = parada.envioId ? enviosMap.get(parada.envioId) : null
      const direccion = parada.direccion ?? envio?.direccionDestino
      if (!direccion) {
        return NextResponse.json({ error: "Direccion obligatoria en paradas" }, { status: 400 })
      }

      paradasData.push({
        orden: index + 1,
        direccion,
        localidad: parada.localidad ?? null,
        ventanaDesde: parada.ventanaDesde ? new Date(parada.ventanaDesde) : null,
        ventanaHasta: parada.ventanaHasta ? new Date(parada.ventanaHasta) : null,
        contactoNombre: parada.contactoNombre ?? null,
        contactoTelefono: parada.contactoTelefono ?? null,
        observaciones: parada.observaciones ?? null,
        envioId: parada.envioId ?? null,
        clienteId: envio?.remito?.clienteId ?? null,
      })
    }

    const ultimo = await prisma.hojaRuta.findFirst({ orderBy: { id: "desc" } })
    const numero = `HR-${String((ultimo?.id ?? 0) + 1).padStart(6, "0")}`

    const hoja = await prisma.hojaRuta.create({
      data: {
        numero,
        fecha,
        estado: "planificada",
        kmEstimado: parsed.data.kmEstimado ?? null,
        observaciones: parsed.data.observaciones ?? null,
        empresaId: ctx.auth.empresaId,
        vehiculoId: parsed.data.vehiculoId ?? null,
        choferId: parsed.data.choferId ?? null,
        paradas: { create: paradasData as Prisma.ParadaRutaUncheckedCreateWithoutHojaRutaInput[] },
      },
      include: {
        vehiculo: true,
        chofer: true,
        paradas: true,
      },
    })

    return NextResponse.json(hoja, { status: 201 })
  } catch (error) {
    console.error("Error al crear hoja de ruta:", error)
    logError("api/distribucion/hojas-ruta:POST", error, request)
    return NextResponse.json({ error: "Error al crear hoja de ruta" }, { status: 500 })
  }
}
