import { SignJWT } from "jose"
import { getEncodedJwtSecret } from "@/lib/auth/jwt-secret"

function getEncodedSecret(): Uint8Array {
  return getEncodedJwtSecret()
}

export interface ImpersonationTokenPayload {
  userId: number
  email: string
  rol: string
  empresaId: number
  impersonating: true
  impersonatedBy: string
  analystUserId: number
  analystEmail: string
}

export async function generarTokenImpersonacion(
  payload: ImpersonationTokenPayload,
  expiresIn = "2h",
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(getEncodedSecret())
}

export function isImpersonationPayload(payload: Record<string, unknown>): boolean {
  return payload.impersonating === true && typeof payload.impersonatedBy === "string"
}