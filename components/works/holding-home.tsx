import Link from "next/link"
import { ArrowRight, Blocks, Building2, Cpu, Sun, Zap } from "lucide-react"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const DOORS = [
  {
    href: "/software",
    title: "Software (Soft)",
    blurb: "POS, Fiado, Oficios, Gym y trial Tier A. El camino SaaS existente.",
    icon: Cpu,
    accent: "from-violet-500/20 to-fuchsia-500/5 border-violet-500/30",
    cta: "Entrar a Soft",
  },
  {
    href: "/energy",
    title: "Energy",
    blurb: "Solar / EPC: lead → presupuesto → seña → partner → cobrado.",
    icon: Sun,
    accent: "from-amber-500/20 to-orange-500/5 border-amber-500/30",
    cta: "Cotizar Energy",
    badge: "MVP",
  },
  {
    href: "/infra",
    title: "Infra",
    blurb: "Obra civil / DC orchestration. Form vivo al motor Works.",
    icon: Building2,
    accent: "from-sky-500/20 to-cyan-500/5 border-sky-500/30",
    cta: "Consulta Infra",
  },
  {
    href: "/blockchain",
    title: "Blockchain",
    blurb: "Audit / solidity partners. Sin custody. Form → Works lead.",
    icon: Blocks,
    accent: "from-emerald-500/20 to-teal-500/5 border-emerald-500/30",
    cta: "Consulta Blockchain",
  },
] as const

/** Holding chooser: Soft door + Works segmentos. Replaces Soft-only root carefully. */
export function HoldingHome() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 antialiased">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Claver Holding">
            <BrandLogo size="sm" theme="dark" variant="group-full" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-slate-300">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/software">Soft trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="max-w-2xl space-y-4">
          <Badge className="bg-amber-500/15 text-amber-200 border-amber-500/30">Grupo Claver · Holding</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Soft para operar.{" "}
            <span className="text-amber-300">Works</span> para orquestar.
          </h1>
          <p className="text-slate-400 text-lg">
            Elegí la puerta: software de gestión (Tier A) o proyectos Energy / Infra / Blockchain
            terciarizados con partners.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {DOORS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition hover:scale-[1.01] ${d.accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950/50">
                  <d.icon className="h-5 w-5 text-white" />
                </div>
                {"badge" in d && d.badge ? (
                  <Badge variant="secondary" className="bg-amber-400 text-slate-950">
                    {d.badge}
                  </Badge>
                ) : null}
              </div>
              <h2 className="mt-4 text-xl font-semibold">{d.title}</h2>
              <p className="mt-2 text-sm text-slate-300/90">{d.blurb}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-white">
                {d.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 flex items-center gap-2 text-xs text-slate-500">
          <Zap className="h-3.5 w-3.5" />
          Soft path (/login, /dashboard, /claver/apps) intacto — Works no intercepta register activar= SaaS.
        </p>
      </main>
    </div>
  )
}
