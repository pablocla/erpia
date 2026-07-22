import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { getEncodedJwtSecret } from "@/lib/auth/jwt-secret"

// Lazy getter — evaluated at request time, not at module load time.
function getEncodedSecret(): Uint8Array {
  return getEncodedJwtSecret()
}

export interface TokenPayload {
  userId: number
  email: string
  rol: string
  empresaId: number
}

export interface AuthResponse {
  success: boolean
  token?: string
  usuario?: {
    id: number
    nombre: string
    email: string
    rol: string
    empresaId: number
    avatarUrl?: string | null
  }
  error?: string
}

export class AuthService {
  async registrarUsuario(
    nombre: string,
    email: string,
    password: string,
    rol: string,
    empresaId: number,
  ): Promise<AuthResponse> {
    try {
      // Verificar si el email ya existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase().trim() },
      })

      if (usuarioExistente) {
        return {
          success: false,
          error: "El email ya está registrado",
        }
      }

      // Verificar que la empresa existe
      const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
      })

      if (!empresa) {
        return {
          success: false,
          error: "Empresa no encontrada",
        }
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10)

      // Crear el usuario
      const usuario = await prisma.usuario.create({
        data: {
          nombre,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          authProvider: "credentials",
          rol,
          empresaId,
        },
      })

      // Generar token
      const token = await this.generarToken({
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      })

      return {
        success: true,
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          empresaId: usuario.empresaId,
          avatarUrl: usuario.avatarUrl,
        },
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      return {
        success: false,
        error: "Error al registrar usuario",
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Buscar el usuario
      const usuario = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase().trim() },
      })

      if (!usuario) {
        return {
          success: false,
          error: "Credenciales inválidas",
        }
      }

      // Verificar si el usuario está activo
      if (!usuario.activo) {
        return {
          success: false,
          error: "Usuario inactivo. Contacte al administrador",
        }
      }

      // Usuarios de Google sin password no pueden hacer login con credenciales
      if (!usuario.password) {
        return {
          success: false,
          error: usuario.authProvider === "google"
            ? "Esta cuenta usa Google para iniciar sesión. Usá el botón \"Continuar con Google\"."
            : "Credenciales inválidas",
        }
      }

      // Verificar la contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password)

      if (!passwordValida) {
        return {
          success: false,
          error: "Credenciales inválidas",
        }
      }

      // Generar token
      const token = await this.generarToken({
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      })

      return {
        success: true,
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          empresaId: usuario.empresaId,
          avatarUrl: usuario.avatarUrl,
        },
      }
    } catch (error) {
      console.error("Error en login:", error)
      return {
        success: false,
        error: "Error al iniciar sesión",
      }
    }
  }

  async generarToken(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .setIssuedAt()
      .sign(getEncodedSecret())
  }

  async verificarToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, getEncodedSecret())
      return payload as unknown as TokenPayload
    } catch (error) {
      console.error("Error al verificar token:", error)
      return null
    }
  }

  async cambiarPassword(userId: number, passwordActual: string, passwordNueva: string): Promise<AuthResponse> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
      })

      if (!usuario) {
        return {
          success: false,
          error: "Usuario no encontrado",
        }
      }

      // Cuentas de Google sin password no pueden cambiar contraseña
      if (usuario.authProvider === "google" && !usuario.password) {
        return {
          success: false,
          error: "Esta cuenta usa Google para iniciar sesión. No se puede cambiar la contraseña.",
        }
      }

      // Verificar password actual
      if (!usuario.password) {
        return {
          success: false,
          error: "No hay contraseña configurada para esta cuenta",
        }
      }
      const passwordValida = await bcrypt.compare(passwordActual, usuario.password)

      if (!passwordValida) {
        return {
          success: false,
          error: "Contraseña actual incorrecta",
        }
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(passwordNueva, 10)

      // Actualizar contraseña
      await prisma.usuario.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      return {
        success: true,
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error)
      return {
        success: false,
        error: "Error al cambiar contraseña",
      }
    }
  }

  async obtenerUsuario(userId: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        empresa: true,
      },
    })

    if (!usuario) {
      return null
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      avatarUrl: usuario.avatarUrl,
      authProvider: usuario.authProvider,
      hasGoogle: !!usuario.googleId,
      hasPassword: !!usuario.password,
      activo: usuario.activo,
      empresaId: usuario.empresaId,
      empresa: {
        id: usuario.empresa.id,
        nombre: usuario.empresa.nombre,
        cuit: usuario.empresa.cuit,
      },
    }
  }
}
