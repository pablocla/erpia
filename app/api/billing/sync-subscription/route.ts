import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { syncMercadoPagoSubscription } from "@/lib/billing/mercadopago-subscription"

/** Sincroniza estado con MP — ideal para probar en local sin webhook. */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const result = await syncMercadoPagoSubscription(ctx.auth.empresaId)
    return NextResponse.json({ success: true, ...result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al sincronizar"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}