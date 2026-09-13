import Link from "next/link"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import { WorksLeadForm } from "@/components/works/works-lead-form"

const COPY: Record<
  "energy" | "infra" | "blockchain",
  { title: string; subtitle: string; bullets: string[] }
> = {
  energy: {
    title: "Claver Energy",
    subtitle: "Orquestamos solar con partners EPC. Cotizás con nosotros; ejecuta el instalador.",
    bullets: [
      "Lead → presupuesto Soft → seña → match EPC",
      "Claver orquesta; no instalamos paneles",
      "Comisión transparente sobre hitos cobrados",
    ],
  },
  infra: {
    title: "Claver Infra",
    subtitle: "Broker de obra civil / DC. Mismo motor Works, segmento infra.",
    bullets: ["Form vivo → Works lead", "Partners civil/dc en registry", "Sin OT Field en este MVP"],
  },
  blockchain: {
    title: "Claver Blockchain",
    subtitle: "Audit / solidity via partners. Sin custody ni exchange.",
    bullets: ["Form → Works lead blockchain", "Partners audit/solidity", "Anti-scope: no tokens/custody"],
  },
}

export function SegmentLanding({ segmento }: { segmento: "energy" | "infra" | "blockchain" }) {
  const c = COPY[segmento]
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="sm" theme="dark" variant="group-full" />
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Holding</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/software">Soft</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest text-amber-300/80">Works · {segmento}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{c.title}</h1>
          <p className="text-slate-400 text-lg">{c.subtitle}</p>
          <ul className="space-y-2 text-sm text-slate-300">
            {c.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-amber-400">✓</span> {b}
              </li>
            ))}
          </ul>
        </div>
        <WorksLeadForm segmento={segmento} title={`Consulta ${segmento}`} />
      </main>
    </div>
  )
}
