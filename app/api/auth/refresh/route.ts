/**
 * POST /api/auth/refresh — Refresh an expired JWT
 * Accepts expired token, verifies user still exists & active, issues new token.
 */
import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/auth/rate-limiter"

const JWT_SECRET = process.env.JWT_SECRET || ""

export async function POST(request: NextRequest) {
  // Rate limit refresh attempts
  const rlResponse = checkRateLimit(request, "refresh", 10, 5 * 60 * 1000)
  if (rlResponse) return rlResponse

  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Decode without verification first to get payload
    const decoded = jwt.decode(token) as {
      userId?: number
      email?: string
      rol?: string
      empresaId?: number
      iat?: number
    } | null

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Reject tokens older than 30 days (absolute expiry)
    const MAX_TOKEN_AGE_SECONDS = 30 * 24 * 60 * 60
    if (decoded.iat && Date.now() / 1000 - decoded.iat > MAX_TOKEN_AGE_SECONDS) {
      return NextResponse.json(
        { error: "Token demasiado antiguo. Inicie sesión nuevamente.", code: "TOKEN_TOO_OLD" },
        { status: 401 },
      )
    }

    // Verify user still exists and is active
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, nombre: true, email: true, rol: true, empresaId: true, activo: true },
    })

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: "Usuario inactivo o no encontrado" },
        { status: 401 },
      )
    }

    // Issue fresh token
    const newToken = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    return NextResponse.json({
      token: newToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      },
    })
  } catch (error) {
    console.error("Error en refresh:", error)
    return NextResponse.json({ error: "Error al renovar sesión" }, { status: 500 })
  }
}
