import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearEnvioCarrier,
  sincronizarTrackingEmpresa,
  resumenCarriersEmpresa,
} from "@/lib/logistica/shipping-orchestrator"

const CrearSchema = z.object({
  accion: z.literal("crear"),
  carrierId: z.enum(["andreani", "oca", "correo_argentino"]),
  pedidoVentaId: z.number().int().positive().optional(),
  remitoId: z.number().int().positive().optional(),
  destinatario: z.object({
    nombre: z.string(),
    email: z.string().optional(),
    telefono: z.string().optional(),
    direccion: z.string(),
    localidad: z.string().optional(),
    provincia: z.string().optional(),
    cp: z.string(),
  }),
  pesoKg: z.number().positive(),
  bultos: z.number().int().positive().optional(),
  valorDeclarado: z.number().positive().optional(),
  observaciones: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const resumen = await resumenCarriersEmpresa(ctx.auth.empresaId)
  return NextResponse.json({ success: true, carriers: resumen })
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()

  if (body.accion === "sync_tracking") {
    const result = await sincronizarTrackingEmpresa(ctx.auth.empresaId)
    return NextResponse.json({ success: true, ...result })
  }

  const parsed = CrearSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { accion: _, carrierId, ...input } = parsed.data
  const result = await crearEnvioCarrier(carrierId, {
    empresaId: ctx.auth.empresaId,
    ...input,
  })

  if (!result.ok) {
    return NextResponse.json({ success: false, ...result }, { status: 400 })
  }

  return NextResponse.json({ success: true, ...result }, { status: 201 })
}