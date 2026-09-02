import type { Metadata } from "next"
import Link from "next/link"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { getSiteUrl } from "@/lib/marketing/landing-seo"
import { ArrowRight, Building2, MessageSquare, ShieldCheck, TriangleAlert } from "lucide-react"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Agent City — lab de agentes ERP",
  description:
    "Torre de control de agentes para procesos Protheus y ARCA. Entrá al lab, recorré departamentos y chateá con Gemini.",
  alternates: { canonical: "/claver/agent-city" },
  openGraph: {
    title: "Agent City | Claver",
    description: "Probá el OS de agentes de Claver: mapa, approvals, incidentes y chat con Gemini.",
    url: `${siteUrl}/claver/agent-city`,
    locale: "es_AR",
    type: "website",
  },
}

export default function AgentCityLandingPage() {
  return (
    <ClaverShell context="matrix" theme="dark-hero">
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <section className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-300">
            Lab Claver · claver.com.ar
          </p>
          <h1 className="max-w-3xl font-[var(--font-fraunces)] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Agent City
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Torre de control de agentes para procesos que ya le cuestan plata a una empresa:
            factura electrónica, conciliación, crédito, “¿dónde está mi pedido?”. Entrá y
            recorré el OS completo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/claver/agent-city/app"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            >
              Entrar a la oficina gamificada
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/claver/apps"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-slate-200 hover:bg-white/5"
            >
              Volver a Apps
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm text-amber-100/90">
            <span className="font-semibold text-amber-300">Sin humo:</span> el mapa, el feed y
            la GPU son simulación. Lo vivo es el chat del agente (Gemini si hay API key en el
            servidor) y el Approval Center como diseño de firma humana.
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <Card
              icon={Building2}
              title="Oficina Gather-style"
              body="WASD para caminar vos. Acercate a un agente y hablá (X) sin link de reunión. Zonas privadas, focus, mute, minimapa, emotes. Canvas 2D en Vercel — no es Zoom, no es WebGPU."
            />
            <Card
              icon={ShieldCheck}
              title="Presencia ERP (Hermes3D-style)"
              body="El piso pinta GET /api/agent-city/presence: facturas, tickets, pedidos, CX. Si hay datos, el feed deja de ser random. Si no, queda DEMO."
            />
            <Card
              icon={MessageSquare}
              title="Chat con Gemini"
              body="Abrí un agente y hablale. Si el server tiene GOOGLE_GENERATIVE_AI_API_KEY o GEMINI_API_KEY, responde el modelo. Si no, hay fallback de lab."
            />
            <Card
              icon={TriangleAlert}
              title="Qué todavía no es"
              body="No pega a Protheus ni a TSS de verdad. El primer job que no se pueda desmentir es el siguiente paso — no este demo."
            />
          </div>

          <p className="mt-12 text-sm text-slate-500">
            Cómo se cobra de verdad (proceso cerrado, no seat de chat):{" "}
            <Link href="/claver/agent-city/app" className="text-emerald-400 hover:underline">
              entrar al lab
            </Link>
            . El manifiesto está en el repo: <code className="text-slate-400">docs/agent-city-sin-humo.md</code>.
          </p>
        </section>
      </div>
    </ClaverShell>
  )
}

function Card({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Building2
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <Icon className="mb-3 h-5 w-5 text-emerald-400" />
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  )
}
