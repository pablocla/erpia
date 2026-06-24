import { guardarCredencialesIntegracion } from "../credentials"
import { oauthRedirectUri } from "./providers"

export interface MLTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: number
  scope?: string
  token_type?: string
}

export async function exchangeMLCode(code: string): Promise<MLTokenResponse> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("ML_CLIENT_ID y ML_CLIENT_SECRET no configurados")
  }

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: oauthRedirectUri("mercado_libre"),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error OAuth Mercado Libre: ${err}`)
  }

  return res.json() as Promise<MLTokenResponse>
}

export async function refreshMLToken(refreshToken: string): Promise<MLTokenResponse> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("ML_CLIENT_ID y ML_CLIENT_SECRET no configurados")
  }

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error refresh Mercado Libre: ${err}`)
  }

  return res.json() as Promise<MLTokenResponse>
}

export async function guardarTokensML(
  empresaId: number,
  tokens: MLTokenResponse,
  nickname?: string,
) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
  return guardarCredencialesIntegracion(
    empresaId,
    "mercado_libre",
    {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      sellerId: String(tokens.user_id),
    },
    {
      cuentaExterna: nickname ?? `ML #${tokens.user_id}`,
      estado: "conectado",
      tokenExpiresAt: expiresAt,
    },
  )
}