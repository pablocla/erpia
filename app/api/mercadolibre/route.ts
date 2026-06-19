import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  guardarConfigML,
  listarPublicaciones,
  obtenerConfigML,
  recibirPedidoML,
  resumenML,
  sincronizarStock,
} from "@/lib/mercadolibre/mercadolibre-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(request.url)
  const vista = searchParams.get("vista")

  if (vista === "config") {
    const config = await obtenerConfigML(ctx.auth.empresaId)
    if (config) {
      return NextResponse.json({
        ...config,
        clientSecret: config.clientSecret ? "••••••••" : null,
        accessToken: config.accessToken ? "••••••••" : null,
        refreshToken: config.refreshToken ? "••••••••" : null,
      })
    }
    return NextResponse.json(null)
  }

  if (vista === "resumen") {
    return NextResponse.json(await resumenML(ctx.auth.empresaId))
  }

  const publicaciones = await listarPublicaciones(ctx.auth.empresaId)
  return NextResponse.json(publicaciones)
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json().catch(() => ({}))
  const accion = body.accion as string | undefined

  if (accion === "sync_stock") {
    const result = await sincronizarStock(ctx.auth.empresaId)
    const status = result.ok ? 200 : 400
    return NextResponse.json(result, { status })
  }

  if (accion === "pedido_recibido" && body.orderId) {
    const result = await recibirPedidoML(ctx.auth.empresaId, {
      orderId: String(body.orderId),
      buyerNickname: body.buyerNickname ? String(body.buyerNickname) : undefined,
      total: Number(body.total ?? 0),
      items: Array.isArray(body.items) ? body.items : undefined,
    })
    return NextResponse.json(result)
  }

  if (body.clientId && body.clientSecret) {
    await guardarConfigML(ctx.auth.empresaId, {
      clientId: String(body.clientId),
      clientSecret: String(body.clientSecret),
      sellerId: body.sellerId ? String(body.sellerId) : undefined,
      accessToken: body.accessToken ? String(body.accessToken) : undefined,
      refreshToken: body.refreshToken ? String(body.refreshToken) : undefined,
      syncStock: body.syncStock !== false,
      syncPrecios: body.syncPrecios === true,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
}