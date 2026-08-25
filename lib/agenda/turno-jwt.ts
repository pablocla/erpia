import { SignJWT, jwtVerify } from "jose"
import { getEncodedJwtSecret } from "@/lib/auth/jwt-secret"

export interface TurnoJwtPayload {
  turnoId: number
  empresaId: number
}

/**
 * Genera un token JWT seguro y sin caducidad (o larga) para compartir el turno.
 * @param turnoId ID del Turno (Agenda)
 * @param empresaId ID de la Empresa
 * @returns Token JWT firmado
 */
export async function generarTokenTurno(turnoId: number, empresaId: number): Promise<string> {
  const payload = { turnoId, empresaId }
  const secret = getEncodedJwtSecret()

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    // No expiration so the link always works (unless revoked by logic)
    .sign(secret)

  return jwt
}

/**
 * Verifica un token JWT de turno y devuelve el payload tipado.
 * @param token Token JWT
 * @returns Payload con turnoId y empresaId, o null si es inválido
 */
export async function verificarTokenTurno(token: string): Promise<TurnoJwtPayload | null> {
  try {
    const secret = getEncodedJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    
    if (typeof payload.turnoId !== "number" || typeof payload.empresaId !== "number") {
      return null
    }

    return {
      turnoId: payload.turnoId,
      empresaId: payload.empresaId,
    }
  } catch (error) {
    return null
  }
}
