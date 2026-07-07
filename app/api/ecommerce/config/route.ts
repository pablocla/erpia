import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import {
  getTiendaConfigAdmin,
  updateTiendaConfigAdmin,
  provisionTiendaDefaults,
} from "@/lib/ecommerce/store-config-service"
import { logError } from "@/lib/monitoring/error-logger"

const mediosPagoSchema = z.object({
  mercadopago: z.boolean(),
  transferencia: z.boolean(),
  confirmarSinPago: z.boolean(),
})

const updateSchema = z.object({
  slug: z.string().min(2).max(48).optional(),
  nombreTienda: z.string().min(2).optional(),
  logoUrl: z.string().url().nullable().optional(),
  colorPrimario: z.string().nullable().optional(),
  mediosPago: mediosPagoSchema.optional(),
  transferenciaCbu: z.string().nullable().optional(),
  transferenciaAlias: z.string().nullable().optional(),
  transferenciaTitular: z.string().nullable().optional(),
  textoEnvio: z.string().nullable().optional(),
  textoFooter: z.string().nullable().optional(),
  activa: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    let config = await getTiendaConfigAdmin(auth.auth.empresaId)
    if (!config) {
      await provisionTiendaDefaults(auth.auth.empresaId)
      config = await getTiendaConfigAdmin(auth.auth.empresaId)
    }
    return NextResponse.json({ config })
  } catch (error) {
    logError("api/ecommerce/config:GET", error, request)
    return NextResponse.json({ error: "Error al cargar configuración" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const empresa = await import("@/lib/prisma").then((m) =>
      m.prisma.empresa.findFirst({ where: whereEmpresa(auth.auth.empresaId) }),
    )
    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    const updated = await updateTiendaConfigAdmin(auth.auth.empresaId, parsed.data)
    return NextResponse.json({ config: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al guardar"
    logError("api/ecommerce/config:PUT", error, request)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}