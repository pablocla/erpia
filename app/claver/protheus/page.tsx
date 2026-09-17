"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Landmark, Lock } from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getToken, useAuthStore } from "@/lib/stores/auth-store"

const NEXT = "/dashboard/protheus"
const ACTIVAR = "edge.investments"
const LOGIN_HREF = `/login?activar=${ACTIVAR}&next=${encodeURIComponent(NEXT)}`
const REGISTER_HREF = `/login/register?activar=${ACTIVAR}&next=${encodeURIComponent(NEXT)}`

export default function ClaverProtheusLandingPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (!isHydrated) return
    if (token || getToken()) router.replace(NEXT)
  }, [isHydrated, token, router])

  return (
    <ClaverShell context="claverp" theme="dark-hero">
      <section className="relative overflow-hidden bg-[#0B1220] pt-28 pb-20 text-white sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(61,155,143,0.28),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Badge className="mb-4 border-emerald-400/30 bg-emerald-500/15 text-emerald-300 font-bold uppercase tracking-wider">
            Add-on TOTVS Protheus
          </Badge>
          <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold sm:text-5xl">
            Inversiones sobre SIGAFIN
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Licencia anual TOTVS, no trial de 14 días ni Mercado Pago del ERP. Al registrarte arranca el
            perfil tesorería; si dan de baja la licencia, se corta este módulo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl px-8" asChild>
              <Link href={LOGIN_HREF}>
                <Lock className="size-4" />
                Entrar con Claver
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/5 px-8 text-white hover:bg-white/10" asChild>
              <Link href={REGISTER_HREF}>Alta con licencia Protheus</Link>
            </Button>
          </div>
          <ul className="mt-10 space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <Landmark className="size-4 text-emerald-400" /> JWT + empresaId · cada cliente su AppServer
            </li>
            <li className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-400" /> Credenciales REST en OPO / Legacy Bridge, no en el browser
            </li>
          </ul>
        </div>
      </section>
    </ClaverShell>
  )
}
