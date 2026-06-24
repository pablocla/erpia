import { guardarCredencialesIntegracion } from "../credentials"
import { oauthRedirectUri } from "./providers"

export interface TNTokenResponse {
  access_token: string
  token_type: string
  scope: string
  user_id: number
}

export async function exchangeTNCode(code: string): Promise<TNTokenResponse> {
  const clientId = process.env.TN_CLIENT_ID
  const clientSecret = process.env.TN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("TN_CLIENT_ID y TN_CLIENT_SECRET no configurados")
  }

  const res = await fetch("https://www.tiendanube.com/apps/authorize/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: oauthRedirectUri("tienda_nube"),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error OAuth Tienda Nube: ${err}`)
  }

  return res.json() as Promise<TNTokenResponse>
}

export async function guardarTokensTN(empresaId: number, tokens: TNTokenResponse, storeName?: string) {
  return guardarCredencialesIntegracion(
    empresaId,
    "tienda_nube",
    {
      accessToken: tokens.access_token,
      storeId: String(tokens.user_id),
    },
    {
      cuentaExterna: storeName ?? `TN #${tokens.user_id}`,
      estado: "conectado",
    },
  )
}