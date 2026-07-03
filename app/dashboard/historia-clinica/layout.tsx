import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AuthService } from "@/lib/auth/auth-service"
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/token-cookie"
import { canUseSku } from "@/lib/platform/entitlements"

/** Historia clínica accesible con Claver Veterinaria (nicho) o ERP core completo */
export default async function HistoriaClinicaLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value
  if (!token) redirect("/login")

  const authService = new AuthService()
  const usuario = await authService.verificarToken(token)
  if (!usuario?.empresaId) redirect("/login")

  const [vet, core] = await Promise.all([
    canUseSku(usuario.empresaId, "niche.vet_barrio"),
    canUseSku(usuario.empresaId, "core.claver"),
  ])

  if (!vet.ok && !core.ok) {
    redirect("/dashboard/apps?sku=niche.vet_barrio&blocked=true")
  }

  return <>{children}</>
}