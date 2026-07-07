import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { createMercadoPagoSubscription } from "@/lib/billing/mercadopago-subscription"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"
import { getSubSaasApp, SUB_SAAS_APPS } from "@/lib/comercial/sub-saas-catalog"
import { getEngancheBySku } from "@/lib/marketplace/enganche-catalog"
import { resolvePrecioSku } from "@/lib/comercial/ofertas-comerciales"
import { activarProducto } from "@/lib/platform/product-lifecycle"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  sku: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
})

function resolvePlan(sku: string) {
  const sub = SUB_SAAS_APPS.find((a) => a.sku === sku)
  const enganche = getEngancheBySku(sku)
  const catalog = resolveSku(sku)
  const nombre = sub?.marca ?? enganche?.nombre ?? catalog?.nombre ?? sku
  const precioArs = resolvePrecioSku(sku)
  return { nombre, precioArs, sku }
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  let sku = parsed.data.sku
  if (!sku && parsed.data.slug) {
    const app = getSubSaasApp(parsed.data.slug)
    if (!app) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }
    sku = app.sku
  }

  if (!sku) {
    return NextResponse.json({ error: "Indicá sku o slug" }, { status: 400 })
  }

  const plan = resolvePlan(sku)
  if (plan.precioArs <= 0) {
    await activarProducto(ctx.auth.empresaId, plan.sku, "subscribe_free")
    await prisma.suscripcionModulo.upsert({
      where: { empresaId_sku: { empresaId: ctx.auth.empresaId, sku: plan.sku } },
      update: { activo: true, vigenciaHasta: null },
      create: { empresaId: ctx.auth.empresaId, sku: plan.sku, activo: true, vigenciaHasta: null },
    })
    return NextResponse.json({
      success: true,
      free: true,
      plan: plan.nombre,
      sku: plan.sku,
      message: "Módulo activado sin costo.",
    })
  }

  try {
    const sub = await createMercadoPagoSubscription({
      empresaId: ctx.auth.empresaId,
      planName: plan.nombre,
      priceArs: plan.precioArs,
      payerEmail: ctx.auth.email ?? "cliente@claver.com.ar",
      sku: plan.sku,
    })

    return NextResponse.json({
      success: true,
      init_point: sub.init_point,
      subscriptionId: sub.id,
      mock: sub.mock ?? false,
      plan: plan.nombre,
      precioArs: plan.precioArs,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear suscripción"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}