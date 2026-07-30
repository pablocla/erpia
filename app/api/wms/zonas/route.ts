import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as ubicacionService from "@/lib/wms/ubicacion-service"
import { z } from "zod"

const createSchema = z.object({
  depositoId: z.number().int().positive(),
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.string().optional(),
  ordenPath: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const depositoId = request.nextUrl.searchParams.get("depositoId")
    const data = await ubicacionService.listarZonas(
      ctx.auth.empresaId,
      depositoId ? Number(depositoId) : undefined,
    )
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/zonas:GET", error, request)
    return NextResponse.json({ error: "Error al listar zonas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const zona = await ubicacionService.crearZona(ctx.auth.empresaId, parsed.data)
    return NextResponse.json(zona, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (msg === "DEPOSITO_NO_ENCONTRADO") {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    logError("api/wms/zonas:POST", error, request)
    return NextResponse.json({ error: "Error al crear zona" }, { status: 500 })
  }
}
