/**
 * Emisión de JWT para preview de actor (rol). Server-only.
 */

import { generarTokenImpersonacion, type ImpersonationTokenPayload } from "@/lib/auth/impersonation"
import { isPreviewActorCodigo, labelForPreviewActor } from "@/lib/auth/preview-experience-catalog"
import { isClaverAnalyst } from "@/lib/auth/claver-analyst"
import { canManageUsers } from "@/lib/auth/admin-roles"

export function canPreviewExperience(opts: { email?: string | null; rol?: string | null }): boolean {
  if (isClaverAnalyst(opts.email, opts.rol ?? undefined)) return true
  return canManageUsers(opts.rol)
}

export function canPreviewRubros(opts: { email?: string | null; rol?: string | null }): boolean {
  return isClaverAnalyst(opts.email, opts.rol ?? undefined)
}

export async function emitirTokenPreviewRol(input: {
  userId: number
  email: string
  empresaId: number
  rol: string
}): Promise<string> {
  if (!isPreviewActorCodigo(input.rol)) {
    throw new Error(`Rol no disponible para preview: ${input.rol}`)
  }
  const payload: ImpersonationTokenPayload = {
    userId: input.userId,
    email: input.email,
    rol: input.rol === "dueno" ? "dueno" : input.rol,
    empresaId: input.empresaId,
    impersonating: true,
    impersonatedBy: input.email,
    analystUserId: input.userId,
    analystEmail: input.email,
    previewKind: "rol",
    previewLabel: labelForPreviewActor(input.rol),
  }
  return generarTokenImpersonacion(payload, "2h")
}
