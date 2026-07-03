import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AuthService } from "@/lib/auth/auth-service"
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/token-cookie"
import { canUseSku } from "@/lib/platform/entitlements"
import { getNicheApp } from "@/lib/niche/niche-apps-catalog"

export default async function NicheAppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ appId: string }>
}) {
  const { appId } = await params
  const app = getNicheApp(appId)
  if (!app) redirect("/dashboard/nicho")

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value
  if (!token) redirect("/login")

  const authService = new AuthService()
  const usuario = await authService.verificarToken(token)
  if (!usuario?.empresaId) redirect("/login")

  let acceso = await canUseSku(usuario.empresaId, app.sku)
  if (!acceso.ok && app.appId === "prestamista") {
    acceso = await canUseSku(usuario.empresaId, "pos.fiado_barrio")
  }
  if (!acceso.ok) {
    redirect(`/dashboard/apps?sku=${app.sku}&blocked=true`)
  }

  return <>{children}</>
}