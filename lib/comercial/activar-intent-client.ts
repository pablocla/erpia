/**
 * Cliente: activar producto post-login con token JWT.
 */

export interface ActivarIntentClientResult {
  success: boolean
  landingPath?: string
  error?: string
}

export async function activarProductoDesdeIntent(
  token: string,
  activar: string,
): Promise<ActivarIntentClientResult> {
  try {
    const res = await fetch("/api/comercial/activar-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activar }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error ?? "No se pudo activar el producto" }
    }
    return {
      success: true,
      landingPath: data.landingPath as string | undefined,
    }
  } catch {
    return { success: false, error: "Error de conexión" }
  }
}