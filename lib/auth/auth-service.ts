import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET no está configurado. Defínelo en las variables de entorno.")
}
// In dev, use a deterministic fixed secret so tokens survive HMR / hot-reload.
// NEVER use this in production — JWT_SECRET env var is enforced above.
const JWT_SECRET = process.env.JWT_SECRET || "dev-pos-system-argentina-2025-unsafe"
const encodedSecret = new TextEncoder().encode(JWT_SECRET)

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
        where: { email },
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
          email,
          password: hashedPassword,
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
        where: { email },
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
      .sign(encodedSecret)
  }

  async verificarToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, encodedSecret)
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

      // Verificar password actual
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
      activo: usuario.activo,
      empresa: {
        id: usuario.empresa.id,
        nombre: usuario.empresa.nombre,
        cuit: usuario.empresa.cuit,
      },
    }
  }
}
