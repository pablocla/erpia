import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AuthService } from "@/lib/auth/auth-service"
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/token-cookie"
import { canUseSku } from "@/lib/platform/entitlements"
import { prisma } from "@/lib/prisma"

/** Agenda: consultorio nicho, veterinaria nicho, ERP core o módulo agenda habilitado */
export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value
  if (!token) redirect("/login")

  const authService = new AuthService()
  const usuario = await authService.verificarToken(token)
  if (!usuario?.empresaId) redirect("/login")

  const empresaId = usuario.empresaId

  const [consultorio, vet, peluqueria, confirma, core, agendaMod, fumigacion] = await Promise.all([
    canUseSku(empresaId, "niche.consultorio_solo"),
    canUseSku(empresaId, "niche.vet_barrio"),
    canUseSku(empresaId, "niche.peluqueria_barrio"),
    canUseSku(empresaId, "micro.confirma_turnos"),
    canUseSku(empresaId, "core.claver"),
    prisma.configuracionModulo.findFirst({
      where: { empresaId, modulo: "agenda", habilitado: true },
    }),
    canUseSku(empresaId, "niche.fumigacion"),
  ])

  if (
    !consultorio.ok &&
    !vet.ok &&
    !peluqueria.ok &&
    !confirma.ok &&
    !core.ok &&
    !agendaMod &&
    !fumigacion.ok
  ) {
    redirect("/dashboard/apps?sku=micro.confirma_turnos&blocked=true")
  }

  return <>{children}</>
}