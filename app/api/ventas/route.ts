import { NextResponse } from "next/server"
import { withAuthAndTenant, zodErrorResponse } from "@/lib/auth/api-guard"
import { TenantViolationError } from "@/lib/auth/tenant-validate"
import { crearVentaConStockSchema } from "@/lib/schemas/ventas"
import { crearVentaConStock } from "@/lib/ventas/crear-venta-stock-service"

/**
 * POST /api/ventas — Venta B2B atómica (factura + stock).
 * Patrón hardening: withAuthAndTenant → Zod → prisma.$transaction (en servicio).
 */
export const POST = withAuthAndTenant(async (req, auth) => {
  const body = await req.json()
  const parsed = crearVentaConStockSchema.safeParse(body)
  if (!parsed.success) {
    return zodErrorResponse(parsed.error)
  }

  try {
    const { clienteId, lineas } = parsed.data
    const factura = await crearVentaConStock(auth.empresaId, parsed.data)

    // Track funnel de activación: first_sale
    import("@/lib/analytics/tracking-service").then(({ trackFunnelStep }) => {
      void trackFunnelStep({
        sessionId: `empresa-${auth.empresaId}`,
        empresaId: auth.empresaId,
        usuarioId: auth.userId,
        funnelId: "activacion",
        stepName: "first_sale",
      })
    }).catch(() => {})

    return NextResponse.json(
      {
        venta: {
          id: factura.id,
          empresaId: auth.empresaId,
          clienteId,
          total: factura.total,
          estado: factura.estado,
          lineas: factura.lineas.map((ln) => ({
            productoId: ln.productoId,
            cantidad: Number(ln.cantidad),
            precioUnitario: Number(ln.precioUnitario),
          })),
        },
        facturaId: factura.id,
        numero: factura.numero,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof TenantViolationError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Error al procesar la venta" },
        { status: 400 },
      )
    }
    throw error
  }
})