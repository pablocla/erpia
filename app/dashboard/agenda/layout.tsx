import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AuthService } from "@/lib/auth/auth-service"
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/token-cookie"
import { canUseSku } from "@/lib/platform/entitlements"

/** Agenda accesible con Claver Consultorio (nicho) o ERP core completo */
export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value
  if (!token) redirect("/login")

  const authService = new AuthService()
  const usuario = await authService.verificarToken(token)
  if (!usuario?.empresaId) redirect("/login")

  const [consultorio, core] = await Promise.all([
    canUseSku(usuario.empresaId, "niche.consultorio_solo"),
    canUseSku(usuario.empresaId, "core.claver"),
  ])

  if (!consultorio.ok && !core.ok) {
    redirect("/dashboard/apps?sku=niche.consultorio_solo&blocked=true")
  }

  return <>{children}</>
}