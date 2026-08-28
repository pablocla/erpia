import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Share2,
  Shield,
  Users,
  Wallet,
  XCircle,
} from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { CommissionCalculator } from "@/components/clavernet/commission-calculator"
import { PARTNER_PROGRAM, PARTNER_PROGRAM_US } from "@/lib/partners/program-copy"
import { getEffectiveMarketId } from "@/lib/i18n/request-market"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: `${PARTNER_PROGRAM.name} | Claver`,
  description: PARTNER_PROGRAM.oneLiner,
}

export default async function PartnersProgramPage() {
  const market = await getEffectiveMarketId()
  const isUs = market === "us"
  const program = isUs ? PARTNER_PROGRAM_US : PARTNER_PROGRAM
  const r = program.rates

  return (
    <ClaverShell context="matrix">
      <section className="relative overflow-hidden bg-[#0B1220] pt-28 pb-16 text-white sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(37,99,235,0.35),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Badge className="mb-4 border-emerald-400/30 bg-emerald-500/15 text-emerald-300 font-bold uppercase tracking-wider">
            {program.heroBadge}
          </Badge>
          <h1 className="max-w-3xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-400">
            {program.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300 font-medium">{program.tagline}</p>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">{program.oneLiner}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400 px-8 py-6 text-md rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-105" asChild>
              <Link href={program.ctaLogin}>
                {isUs ? "Become a Partner Now" : "Quiero Ser Partner Ahora"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl px-8 py-6"
              asChild
            >
              <Link href="/demo">{isUs ? "Watch Live Demos" : "Ver Demos en Vivo"}</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400 font-medium">
            <li className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-emerald-400" /> {isUs ? "Instant Affiliate Link" : "Link de Afiliado al Instante"}
            </li>
            <li className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" /> {r.sellerN1}% {isUs ? "Level 1" : "Nivel 1"} · {r.sellerN2}% {isUs ? "Level 2" : "Nivel 2"}
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" /> {isUs ? "Setup 100% to the implementer · no membership" : "Setup 100% a quien implementa · sin membresía"}
            </li>
          </ul>
        </div>
      </section>

      <section className="border-b bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900 sm:text-3xl">
            {isUs ? "How it works" : "Cómo funciona"}
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {program.howItWorks.map((s) => (
              <li key={s.step} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b bg-[#f8fafc] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
            {isUs ? "Roles and Commissions" : "Roles y comisiones"}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {program.roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.forWho}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>N1:</strong> {role.earns}
                  </p>
                  <p>
                    <strong>N2:</strong> {role.n2}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {isUs
              ? "Illustration only: 50 free ledgers × 10% turn on an extra → 5 paying shops. You earn on those extras, not on the free hook."
              : "Ilustración: 50 libretas gratis × 10% prenden extra → 5 pagos. Cobrás esos extras, no el gancho $0. Usá el simulador abajo."}
          </p>
        </div>
      </section>

      <section id="reglas" className="border-b bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
              {isUs ? "Program rules" : "Reglas del programa"}
            </h2>
            <ul className="mt-6 space-y-3">
              {program.rules.map((rule) => (
                <li key={rule} className="flex gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-[var(--font-fraunces)] text-2xl font-semibold text-slate-900">
              {isUs ? "What this is NOT" : "Esto NO es"}
            </h2>
            <ul className="mt-6 space-y-3">
              {program.notThis.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-slate-700">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-4 py-10 sm:px-6">
        <CommissionCalculator />
      </section>

      <section className="bg-slate-950 px-4 py-16 text-center text-white sm:px-6">
        <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold">
          {isUs ? "Start referring today" : "Empezá a referir hoy"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          {isUs 
            ? "Activate your portal, copy your link and share it with local businesses in your area."
            : "Activá el portal, copiá claver.com.ar/f?ref=TUCODIGO y dejalo en el local. La comisión llega cuando prenden un extra."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" asChild>
            <Link href={program.ctaLogin}>{isUs ? "Go to Partner Portal" : "Ir al Portal Partner"}</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
            <Link href={program.ctaRegister}>{isUs ? "Create Claver account" : "Crear cuenta Claver"}</Link>
          </Button>
        </div>
      </section>
    </ClaverShell>
  )
}
