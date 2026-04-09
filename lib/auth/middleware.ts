import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "./auth-service"

const authService = new AuthService()

export async function verificarToken(request: NextRequest): Promise<any | null> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await authService.verificarToken(token)

  return payload
}

export async function verificarAutenticacion(request: NextRequest): Promise<{
  autenticado: boolean
  usuario?: any
  error?: string
}> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      autenticado: false,
      error: "Token no proporcionado",
    }
  }

  const token = authHeader.substring(7)
  const payload = await authService.verificarToken(token)

  if (!payload) {
    return {
      autenticado: false,
      error: "Token inválido o expirado",
    }
  }

  return {
    autenticado: true,
    usuario: payload,
  }
}

export function verificarRol(usuario: any, rolesPermitidos: string[]): boolean {
  return rolesPermitidos.includes(usuario.rol)
}

export function crearRespuestaNoAutorizado(mensaje = "No autorizado") {
  return NextResponse.json({ error: mensaje }, { status: 401 })
}

export function crearRespuestaForbidden(mensaje = "Acceso denegado") {
  return NextResponse.json({ error: mensaje }, { status: 403 })
}
