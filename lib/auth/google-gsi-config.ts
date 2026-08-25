/**
 * Google Identity Services (GSI) — Sign in with Google.
 *
 * El botón GSI en modo popup devuelve el id_token con
 * `window.opener.postMessage`. Si la página manda
 * `Cross-Origin-Opener-Policy: same-origin`, Chrome corta el opener
 * y el login queda girando para siempre (el aviso en consola es
 * "COOP policy would block the window.postMessage call").
 *
 * FedCM evita el popup cuando el browser lo soporta; COOP
 * `same-origin-allow-popups` es el fallback oficial de Google.
 *
 * @see https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
 */

export const GOOGLE_GSI_COOP_VALUE = "same-origin-allow-popups" as const

/** Sin COEP isolation: COEP require-corp + COOP same-origin también rompe el popup. */
export const GOOGLE_GSI_COEP_VALUE = "unsafe-none" as const

/** FedCM (Chrome) necesita esta feature en Permissions-Policy. */
export const GOOGLE_GSI_FEDCM_PERMISSIONS_POLICY =
  'identity-credentials-get=(self "https://accounts.google.com")'

export type GoogleGsiError = {
  type?: string
  message?: string
}

export function buildGoogleGsiInitConfig(input: {
  clientId: string
  callback: (response: { credential: string }) => void
  errorCallback?: (error: GoogleGsiError) => void
}) {
  return {
    client_id: input.clientId,
    callback: input.callback,
    error_callback: input.errorCallback,
    context: "signin" as const,
    ux_mode: "popup" as const,
    auto_select: false,
    itp_support: true,
    use_fedcm_for_prompt: true,
    use_fedcm_for_button: true,
  }
}

export function mensajeErrorGoogleGsi(error: GoogleGsiError | string | undefined): string {
  const type = typeof error === "string" ? error : error?.type
  const message = typeof error === "string" ? error : error?.message
  if (type === "popup_closed" || type === "popup_closed_by_user") {
    return "Cerraste la ventana de Google. Volvé a intentar."
  }
  if (type === "popup_failed_to_open") {
    return "El navegador bloqueó la ventana de Google. Permití popups para este sitio."
  }
  if (message?.trim()) return message.trim()
  return "No se pudo completar el inicio de sesión con Google. Reintentá."
}
