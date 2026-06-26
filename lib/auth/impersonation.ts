import { SignJWT } from "jose"

function getEncodedSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no está configurado")
  }
  return new TextEncoder().encode(secret || "dev-pos-system-argentina-2025-unsafe")
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