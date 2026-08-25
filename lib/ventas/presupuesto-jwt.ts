import { SignJWT, jwtVerify } from "jose"
import { getEncodedJwtSecret } from "@/lib/auth/jwt-secret"

export interface PresupuestoPayload {
  presupuestoId: number
  empresaId: number
}

/**
 * Genera un token JWT público para un presupuesto.
 * Válido por 90 días (la caducidad real depende de la DB).
 */
export async function generarTokenPresupuesto(presupuestoId: number, empresaId: number): Promise<string> {
  const secret = getEncodedJwtSecret()
  const token = await new SignJWT({ presupuestoId, empresaId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret)

  return token
}

/**
 * Verifica un token JWT de presupuesto y retorna su payload.
 */
export async function verificarTokenPresupuesto(token: string): Promise<PresupuestoPayload | null> {
  try {
    const secret = getEncodedJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    
    if (typeof payload.presupuestoId === "number" && typeof payload.empresaId === "number") {
      return {
        presupuestoId: payload.presupuestoId,
        empresaId: payload.empresaId,
      }
    }
    return null
  } catch (error) {
    console.error("Error validando token de presupuesto:", error)
    return null
  }
}
