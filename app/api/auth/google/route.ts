import { NextRequest, NextResponse } from "next/server"
import { authenticateWithGoogle } from "@/lib/auth/google-auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"

/**
 * POST /api/auth/google
 *
 * Grupo Claver — Google Sign-In for all product surfaces (ERP, portal cliente, etc.).
 *
 * Body: { idToken: string, empresaNombre?: string, activar?: string }
 *
 * - Existing active user (email/googleId) → JWT
 * - Invited inactive user with open invite → activate + JWT
 * - New user + empresaNombre → create empresa + owner (dueno)
 * - New user without empresa → EMPRESA_REQUIRED (422)
 * - Free join via empresaId → 403 (disabled)
 */
export async function POST(request: NextRequest) {
  const blocked = checkRateLimit(request, "auth-google", 20, 15 * 60 * 1000)
  if (blocked) return blocked

  try {
    const body = await request.json()
    const { idToken, empresaNombre, empresaId, activar } = body as {
      idToken?: string
      empresaNombre?: string
      empresaId?: number
      activar?: string
    }

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Token de Google no proporcionado" },
        { status: 400 },
      )
    }

    const result = await authenticateWithGoogle({
      idToken,
      empresaNombre,
      empresaId,
      activar,
    })

    if (!result.success) {
      if (result.error === "EMPRESA_REQUIRED") {
        return NextResponse.json(
          {
            success: false,
            error: "EMPRESA_REQUIRED",
            message: (result as any).message,
            googleUser: (result as any).googleUser,
          },
          { status: 422 },
        )
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: (result as any).status || 400 },
      )
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      usuario: result.usuario,
      isNewUser: result.isNewUser,
      activatedInvite: result.activatedInvite ?? false,
      onboarding: result.onboarding ?? null,
    })
  } catch (error) {
    console.error("[Google Auth] Error:", error)
    return NextResponse.json(
      { success: false, error: "Error interno al procesar login con Google" },
      { status: 500 },
    )
  }
}
