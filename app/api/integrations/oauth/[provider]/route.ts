import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isAdminRole } from "@/lib/auth/admin-roles"
import { buildAuthUrl, type OAuthProviderId } from "@/lib/integrations/oauth/providers"
import { buildShopifyAuthUrl } from "@/lib/integrations/oauth/shopify-oauth"
import { createOAuthState } from "@/lib/integrations/oauth/state"
import { normalizeShopDomain } from "@/lib/shopify/shopify-api"
import { guardarCredencialesIntegracion } from "@/lib/integrations/credentials"

const VALID = ["mercado_libre", "tienda_nube", "shopify"] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
  }

  const { provider } = await params
  if (!VALID.includes(provider as typeof VALID[number])) {
    return NextResponse.json({ error: "Proveedor OAuth no soportado" }, { status: 400 })
  }

  const returnPath = request.nextUrl.searchParams.get("return") ?? `/dashboard/conexiones/${provider}`
  const state = createOAuthState({
    empresaId: ctx.auth.empresaId,
    integracionId: provider,
    userId: ctx.auth.userId,
    returnPath,
  })

  if (provider === "shopify") {
    const shop = request.nextUrl.searchParams.get("shop")
    if (!shop) {
      return NextResponse.json({ error: "Ingresá el dominio myshopify.com antes de OAuth" }, { status: 400 })
    }
    const shopDomain = normalizeShopDomain(shop)
    await guardarCredencialesIntegracion(ctx.auth.empresaId, "shopify", { shopDomain })
    const authUrl = buildShopifyAuthUrl(shopDomain, state)
    if (!authUrl) {
      return NextResponse.json({ error: "Definí SHOPIFY_CLIENT_ID en variables de entorno" }, { status: 503 })
    }
    return NextResponse.redirect(authUrl)
  }

  const authUrl = buildAuthUrl(provider as OAuthProviderId, state)
  if (!authUrl) {
    const envHint = provider === "mercado_libre" ? "ML_CLIENT_ID" : "TN_CLIENT_ID"
    return NextResponse.json(
      { error: `OAuth no configurado. Definí ${envHint} en variables de entorno.` },
      { status: 503 },
    )
  }

  return NextResponse.redirect(authUrl)
}