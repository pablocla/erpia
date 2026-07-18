import { type NextRequest, NextResponse } from "next/server"
import { verifyOAuthState } from "@/lib/integrations/oauth/state"
import { exchangeMLCode, guardarTokensML } from "@/lib/integrations/oauth/mercadolibre-oauth"
import { exchangeTNCode, guardarTokensTN } from "@/lib/integrations/oauth/tiendanube-oauth"
import { exchangeShopifyCode, guardarTokensShopify } from "@/lib/integrations/oauth/shopify-oauth"
import { guardarConexion } from "@/lib/integrations/connection-service"
function redirectWith(base: string, path: string, query: Record<string, string>) {
  const url = new URL(path, base)
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
  return NextResponse.redirect(url)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  const base = process.env.NEXT_PUBLIC_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? request.nextUrl.origin
  const error = request.nextUrl.searchParams.get("error")
  const code = request.nextUrl.searchParams.get("code")
  const stateRaw = request.nextUrl.searchParams.get("state")

  const state = stateRaw ? verifyOAuthState(stateRaw) : null
  const returnPath = state?.returnPath ?? `/dashboard/conexiones/${provider}`

  if (error || !code || !state) {
    return redirectWith(base, returnPath, {
      oauth: "error",
      msg: error ?? "Estado OAuth inválido o expirado",
    })
  }

  if (state.integracionId !== provider) {
    return redirectWith(base, returnPath, { oauth: "error", msg: "Proveedor no coincide" })
  }

  try {
    if (provider === "mercado_libre") {
      const tokens = await exchangeMLCode(code)
      let nickname: string | undefined
      try {
        const me = await fetch("https://api.mercadolibre.com/users/me", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        if (me.ok) {
          const data = await me.json() as { nickname?: string }
          nickname = data.nickname
        }
      } catch { /* optional */ }

      await guardarTokensML(state.empresaId, tokens, nickname)
      await guardarConexion(state.empresaId, "mercado_libre", {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        sellerId: String(tokens.user_id),
      })
    } else if (provider === "shopify") {
      const shop = request.nextUrl.searchParams.get("shop")
      if (!shop) throw new Error("Falta parámetro shop")
      const tokens = await exchangeShopifyCode(shop, code)
      await guardarTokensShopify(state.empresaId, shop, tokens.access_token)
      await guardarConexion(state.empresaId, "shopify", {
        accessToken: tokens.access_token,
        shopDomain: shop,
      })
    } else if (provider === "tienda_nube") {
      const tokens = await exchangeTNCode(code)
      let storeName: string | undefined
      try {
        const store = await fetch(`https://api.tiendanube.com/v1/${tokens.user_id}/store`, {
          headers: tnHeaders(tokens.access_token),
        })
        if (store.ok) {
          const data = await store.json() as { name?: { es?: string } }
          storeName = data.name?.es
        }
      } catch { /* optional */ }

      await guardarTokensTN(state.empresaId, tokens, storeName)
      await guardarConexion(state.empresaId, "tienda_nube", {
        accessToken: tokens.access_token,
        storeId: String(tokens.user_id),
      })
    } else {
      return redirectWith(base, returnPath, { oauth: "error", msg: "Proveedor no soportado" })
    }

    return redirectWith(base, returnPath, { oauth: "ok" })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al conectar"
    return redirectWith(base, returnPath, { oauth: "error", msg })
  }
}

function tnHeaders(token: string): HeadersInit {
  const appName = process.env.TN_APP_NAME ?? "Claverp ERP"
  const contact = process.env.TN_CONTACT_EMAIL ?? "soporte@claverp.com"
  return {
    Authentication: `bearer ${token}`,
    "User-Agent": `${appName} (${contact})`,
    Accept: "application/json",
  }
}