export type OAuthProviderId = "mercado_libre" | "tienda_nube"

export interface OAuthProviderConfig {
  id: OAuthProviderId
  authUrl: string
  tokenUrl: string
  scopes?: string[]
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? "http://localhost:3000"
}

export function oauthRedirectUri(provider: OAuthProviderId): string {
  const envKey = provider === "mercado_libre" ? "ML_REDIRECT_URI" : "TN_REDIRECT_URI"
  return process.env[envKey] ?? `${baseUrl()}/api/integrations/oauth/${provider}/callback`
}

export function getOAuthProvider(provider: string): OAuthProviderConfig | null {
  if (provider === "mercado_libre") {
    const clientId = process.env.ML_CLIENT_ID
    if (!clientId) return null
    return {
      id: "mercado_libre",
      authUrl: "https://auth.mercadolibre.com.ar/authorization",
      tokenUrl: "https://api.mercadolibre.com/oauth/token",
    }
  }
  if (provider === "tienda_nube") {
    const clientId = process.env.TN_CLIENT_ID
    if (!clientId) return null
    return {
      id: "tienda_nube",
      authUrl: `https://www.tiendanube.com/apps/${clientId}/authorize`,
      tokenUrl: "https://www.tiendanube.com/apps/authorize/token",
    }
  }
  return null
}

export function buildAuthUrl(provider: OAuthProviderId, state: string): string | null {
  const cfg = getOAuthProvider(provider)
  if (!cfg) return null
  const redirectUri = oauthRedirectUri(provider)

  if (provider === "mercado_libre") {
    const clientId = process.env.ML_CLIENT_ID!
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    })
    return `${cfg.authUrl}?${params}`
  }

  const params = new URLSearchParams({ state })
  return `${cfg.authUrl}?${params}`
}