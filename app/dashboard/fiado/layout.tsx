import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AuthService } from "@/lib/auth/auth-service"
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/token-cookie"
import { canUseSku } from "@/lib/platform/entitlements"

export default async function FiadoLayout({ children }: { children: React.ReactNode }) {
  // 1. Verificar sesión desde las cookies de forma segura
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value
  
  if (!token) {
    redirect("/login")
  }

  const authService = new AuthService()
  const usuario = await authService.verificarToken(token)

  if (!usuario || !usuario.empresaId) {
    redirect("/login")
  }

  // 2. Hard Gating: Verificar si la App "Libreta Fiado" está activa para la empresa
  const acceso = await canUseSku(usuario.empresaId, "pos.fiado_barrio")
  if (!acceso.ok) {
    // Si no está instalada o está inactiva, expulsar al marketplace o dashboard
    redirect("/dashboard/apps?sku=pos.fiado_barrio&blocked=true")
  }

  // 3. Renderizar el módulo
  return <>{children}</>
}
