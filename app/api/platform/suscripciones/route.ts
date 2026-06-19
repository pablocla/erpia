import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  listSuscripciones,
  upsertSuscripcion,
  getMonthlyUsageTotal,
  resolveEventLimit,
  currentUsageMonth,
} from "@/lib/platform/commercial-service"

const ADMIN_ROLES = new Set(["admin", "administrador", "gerente", "dueno"])

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const suscripciones = await listSuscripciones(ctx.auth.empresaId)
  const mes = currentUsageMonth()

  const enriched = await Promise.all(
    suscripciones.map(async (s) => {
      const usado = await getMonthlyUsageTotal(ctx.auth.empresaId, s.sku, mes)
      const limite = await resolveEventLimit(ctx.auth.empresaId, s.sku)
      return {
        ...s,
        uso: { mes, usado, limite },
      }
    })
  )

  return NextResponse.json({ suscripciones: enriched })
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!ADMIN_ROLES.has(ctx.auth.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.sku !== "string") {
    return NextResponse.json({ error: "sku requerido" }, { status: 400 })
  }

  const suscripcion = await upsertSuscripcion(ctx.auth.empresaId, {
    sku: body.sku,
    activo: typeof body.activo === "boolean" ? body.activo : undefined,
    vigenciaHasta:
      body.vigenciaHasta === null
        ? null
        : typeof body.vigenciaHasta === "string"
          ? new Date(body.vigenciaHasta)
          : undefined,
    limiteEventosMes:
      body.limiteEventosMes === null
        ? null
        : typeof body.limiteEventosMes === "number"
          ? body.limiteEventosMes
          : undefined,
  })

  return NextResponse.json({ suscripcion })
}