import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as ubicacionService from "@/lib/wms/ubicacion-service"
import { z } from "zod"

const createSchema = z.object({
  depositoId: z.number().int().positive(),
  codigo: z.string().min(1),
  zonaId: z.number().int().positive().optional().nullable(),
  pasillo: z.string().optional(),
  rack: z.string().optional(),
  nivel: z.string().optional(),
  celda: z.string().optional(),
  tipo: z.string().optional(),
  capacidad: z.number().optional().nullable(),
  ordenPath: z.number().int().optional(),
})

const seedSchema = z.object({
  depositoId: z.number().int().positive(),
  pasillos: z.number().int().min(1).max(20).optional(),
  racks: z.number().int().min(1).max(50).optional(),
  niveles: z.number().int().min(1).max(20).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const sp = request.nextUrl.searchParams
    const data = await ubicacionService.listarUbicaciones(ctx.auth.empresaId, {
      depositoId: sp.get("depositoId") ? Number(sp.get("depositoId")) : undefined,
      zonaId: sp.get("zonaId") ? Number(sp.get("zonaId")) : undefined,
      tipo: sp.get("tipo") ?? undefined,
      q: sp.get("q") ?? undefined,
    })
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/ubicaciones:GET", error, request)
    return NextResponse.json({ error: "Error al listar ubicaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const body = await request.json()

    if (body?.action === "seed") {
      const parsed = seedSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
      }
      const result = await ubicacionService.seedUbicacionesGrid(
        ctx.auth.empresaId,
        parsed.data.depositoId,
        parsed.data,
      )
      return NextResponse.json(result, { status: 201 })
    }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const ub = await ubicacionService.crearUbicacion(ctx.auth.empresaId, parsed.data)
    return NextResponse.json(ub, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (msg === "DEPOSITO_NO_ENCONTRADO" || msg === "ZONA_NO_ENCONTRADA") {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    logError("api/wms/ubicaciones:POST", error, request)
    return NextResponse.json({ error: "Error al crear ubicación" }, { status: 500 })
  }
}
