"use client"

import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  Bell,
  Bot,
  Cable,
  GitBranch,
  Landmark,
  MessageCircle,
  Radio,
  Send,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react"
import { ClaverShell } from "@/components/marketing/claver-shell"
import { Button } from "@/components/ui/button"

const LOGIN = `/login?activar=edge.investments&next=${encodeURIComponent("/dashboard/protheus")}`
const REGISTER = `/login/register?activar=edge.investments&next=${encodeURIComponent("/dashboard/protheus")}`
const APP = "/dashboard/protheus"

export function ProtheusPartnerLanding() {
  return (
    <ClaverShell context="claverp" theme="dark-hero">
      <div className="bg-[#070c12] text-slate-100">
        <Hero />
        <ValueStrip />
        <Windows />
        <Flows />
        <ControlPanel />
        <AiLoadout />
        <Ontology />
        <Cta />
      </div>
    </ClaverShell>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(61,155,143,0.28),transparent)]" />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
          Claver × TOTVS · add-on sobre SIGAFIN
        </p>
        <h1 className="mt-4 max-w-4xl font-[var(--font-fraunces)] text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Inteligencia sobre los datos que ya viven en Protheus.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          El ERP sigue siendo el system of record. Claver es la herramienta: cartera, alertas,
          WhatsApp, Telegram y modelos (Grok, Claude, Gemini o local) leyendo reglas de negocio
          por REST. El cliente no cambia de backoffice. Le pone cerebro a lo que ya tiene.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" className="rounded-xl bg-emerald-500 px-8 text-slate-950 hover:bg-emerald-400" asChild>
            <Link href={APP}>
              Abrir la app
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/5 px-8 text-white hover:bg-white/10" asChild>
            <Link href={REGISTER}>Alta licencia anual</Link>
          </Button>
        </div>
        <p className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          <ArrowDown className="size-3.5" /> Scroll · valor, ventanas, flujos, control, IA, ontología
        </p>
      </div>
    </section>
  )
}

function ValueStrip() {
  const items = [
    { n: "01", t: "No se pisa SIGAFIN", d: "SA6, SED, SE5 y FINA100 nativos. Z01–Z03 solo para lo que Protheus no tiene: mark-to-market." },
    { n: "02", t: "Un cliente = un REST", d: "Cada tenant Claver apunta al AppServer de esa empresa. HTTPS Cloud. Sin claves en el browser." },
    { n: "03", t: "Licencia TOTVS, no trial ERP", d: "Año de uso. Si dan de baja el producto, se corta este módulo. Mercado Pago del POS no interviene." },
    { n: "04", t: "IA sobre el dato real", d: "Browse + ontología OPO + REST. El modelo ve reglas, no una planilla exportada." },
  ]
  return (
    <section className="border-y border-white/10 bg-[#0b1220] px-4 py-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.n}>
            <p className="font-[var(--font-geist-mono)] text-xs text-emerald-400">{i.n}</p>
            <h2 className="mt-2 font-[var(--font-fraunces)] text-xl">{i.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{i.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Windows() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Ventanas</p>
        <h2 className="mt-3 font-[var(--font-fraunces)] text-3xl sm:text-4xl">Lo que el tesorero ve. Lo que el analista deja listo.</h2>
        <p className="mt-3 max-w-xl text-slate-400">
          Primer ingreso: analista baja PRW y expone REST. Tesorero entra a cartera. El menú no mezcla POS ni AFIP.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <OsWindow title="Cartera">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Stat k="Mark-to-market" v="$ 21,3 M" />
              <Stat k="Resultado" v="+$ 1,2 M" good />
              <Stat k="Vencen 7d" v="1" />
            </div>
            <div className="mt-4 space-y-2">
              <Row name="Plazo fijo 30d" meta="Galicia" val="$ 12,4 M" />
              <Row name="FCI money market" meta="Galicia" val="$ 5,7 M" />
              <Row name="Lecap S31O6" meta="Santander" val="$ 3,4 M" />
            </div>
          </OsWindow>
          <OsWindow title="Valuación diaria">
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex justify-between text-slate-200"><span>Hoy</span><span className="font-[var(--font-geist-mono)]">$ 12.355.342</span></p>
              <p className="flex justify-between"><span>Cálculo TNA</span><span>+$ 12.876</span></p>
              <p className="flex justify-between"><span>API mercado</span><span>fase 2</span></p>
              <div className="mt-4 h-16 rounded-md bg-gradient-to-r from-emerald-500/20 to-transparent" />
            </div>
          </OsWindow>
          <OsWindow title="Bancos">
            <Row name="Galicia Cta. Cte." meta="SA6 001" val="$ 18,4 M" />
            <Row name="Santander" meta="SA6 002" val="$ 6,2 M" />
            <Row name="Mercado Pago" meta="CVU" val="$ 2,3 M" />
          </OsWindow>
          <OsWindow title="Primer ingreso">
            <p className="text-sm text-slate-300">¿Qué vas a hacer en este tenant?</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">Analista · PRW + REST</div>
              <div className="rounded-lg border border-white/10 p-3 text-slate-400">Tesorero · cartera</div>
            </div>
          </OsWindow>
        </div>
      </div>
    </section>
  )
}

function Flows() {
  const nodes = [
    { icon: GitBranch, t: "Browse", d: "Cartera, bancos, movimientos. Lectura REST del AppServer de ese cliente." },
    { icon: Bell, t: "Alertas", d: "Vencimientos, MTM vs costo, REST caído, licencia por vencer." },
    { icon: Workflow, t: "Automatizaciones", d: "Job valuación, health, secuencias. El asiento lo hace FINA100, no un INSERT." },
  ]
  return (
    <section className="border-y border-white/10 bg-[#0b1220] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Diagrama de flujo</p>
        <h2 className="mt-3 font-[var(--font-fraunces)] text-3xl sm:text-4xl">Browse → alerta → acción en el ERP.</h2>
        <div className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {nodes.map((n, i) => {
            const Icon = n.icon
            return (
              <div key={n.t} className="flex flex-1 items-stretch gap-4">
                <div className="flex-1 rounded-2xl border border-white/10 bg-[#070c12] p-6">
                  <Icon className="size-5 text-emerald-400" />
                  <h3 className="mt-4 font-[var(--font-fraunces)] text-2xl">{n.t}</h3>
                  <p className="mt-2 text-sm text-slate-400">{n.d}</p>
                </div>
                {i < nodes.length - 1 && (
                  <ArrowRight className="hidden size-5 shrink-0 self-center text-slate-600 lg:block" />
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-8 max-w-2xl text-sm text-slate-500">
          El socio TOTVS deja FINZINV + diccionario. Claver orquesta el browse y las alertas. Protheus ejecuta la plata.
        </p>
      </div>
    </section>
  )
}

function ControlPanel() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Control panel</p>
        <h2 className="mt-3 font-[var(--font-fraunces)] text-3xl sm:text-4xl">WhatsApp y Telegram, no otra casilla de mail.</h2>
        <p className="mt-3 max-w-xl text-slate-400">
          El tesorero no vive en el AppServer. Las alertas salen al canal que ya usa el cliente.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <OsWindow title="Canales">
            <ToggleRow icon={MessageCircle} name="WhatsApp Business" on meta="Vencimiento · MTM · REST down" />
            <ToggleRow icon={Send} name="Telegram" on meta="Grupo tesorería · job 18:30" />
            <ToggleRow icon={Bell} name="Mail CFO" off meta="Opcional" />
          </OsWindow>
          <OsWindow title="Reglas">
            <p className="text-sm text-slate-300">Si MTM cae 3% vs costo → WA al tesorero.</p>
            <p className="mt-2 text-sm text-slate-300">Si vence en 48 h → Telegram + browse.</p>
            <p className="mt-2 text-sm text-slate-400">Sin REST público no hay alerta en vivo (LAN = Edge Agent, fase 2).</p>
          </OsWindow>
        </div>
      </div>
    </section>
  )
}

function AiLoadout() {
  const slots = [
    { name: "Grok", where: "Cloud xAI", use: "Explicar cartera y riesgos en es-AR" },
    { name: "Claude", where: "Cloud Anthropic", use: "Políticas y conciliación de reglas" },
    { name: "Gemini", where: "Cloud Google", use: "Agent City / lab" },
    { name: "Local", where: "On-prem / GPU", use: "Dato que no puede salir del datacenter" },
  ]
  return (
    <section className="border-y border-white/10 bg-[#0b1220] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">IA · loadout</p>
        <h2 className="mt-3 font-[var(--font-fraunces)] text-3xl sm:text-4xl">El modelo es enchufable. El dato es Protheus.</h2>
        <p className="mt-3 max-w-xl text-slate-400">
          Conexión por API: cloud o local. Claver no reemplaza el modelo del cliente; le da contexto ontológico y REST.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((s) => (
            <div key={s.name} className="rounded-2xl border border-white/10 bg-[#070c12] p-5">
              <Bot className="size-5 text-emerald-400" />
              <h3 className="mt-3 text-lg font-medium">{s.name}</h3>
              <p className="mt-1 font-[var(--font-geist-mono)] text-[11px] text-emerald-400/80">{s.where}</p>
              <p className="mt-3 text-sm text-slate-400">{s.use}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Ontology() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Ontología OPO</p>
        <h2 className="mt-3 font-[var(--font-fraunces)] text-3xl sm:text-4xl">Reglas de negocio en REST. No en un Excel.</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Customer, Instrument, Holding. El front habla canónico. El adapter traduce a SA1, Z01, Z02.
          La IA lee el canónico: “esta tenencia vence, este banco es el origen del ND”.
        </p>
        <div className="mt-12 overflow-x-auto rounded-2xl border border-white/10 bg-[#070c12] p-6">
          <div className="flex min-w-[720px] items-center justify-between gap-3 text-center text-xs">
            <Onto n="UI Claver" d="Cartera tesorero" />
            <Cable className="size-4 shrink-0 text-slate-600" />
            <Onto n="OPO" d="Holding · Instrument · Customer" />
            <Radio className="size-4 shrink-0 text-slate-600" />
            <Onto n="REST Claver" d="/investments/*" />
            <ArrowRight className="size-4 shrink-0 text-emerald-400" />
            <Onto n="Protheus" d="Z02 · Z03 · SA6 · FINA100" />
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-slate-500">
          La interfaz es la herramienta. El cliente pone inteligencia a sus datos sin migrar el ERP.
        </p>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="border-t border-white/10 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <Sparkles className="mx-auto size-6 text-emerald-400" />
        <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl sm:text-4xl">Para el canal TOTVS: overlay, no reemplazo.</h2>
        <p className="mt-4 text-slate-400">
          Licencia anual. Analista compila. Tesorero opera. SIGAFIN no se toca.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400" asChild>
            <Link href={LOGIN}>Entrar</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10" asChild>
            <Link href={REGISTER}>Registrar tenant</Link>
          </Button>
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Shield className="size-3.5" /> <Landmark className="size-3.5" /> Protheus system of record · Claver intelligence layer
        </p>
      </div>
    </section>
  )
}

function OsWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e1620] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <span className="size-2 rounded-full bg-red-400/80" />
        <span className="size-2 rounded-full bg-amber-400/80" />
        <span className="size-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-xs text-slate-500">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Stat({ k, v, good }: { k: string; v: string; good?: boolean }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{k}</p>
      <p className={`mt-1 font-[var(--font-geist-mono)] text-sm ${good ? "text-emerald-400" : "text-slate-100"}`}>{v}</p>
    </div>
  )
}

function Row({ name, meta, val }: { name: string; meta: string; val: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 px-3 py-2 text-sm">
      <div>
        <p className="text-slate-200">{name}</p>
        <p className="text-[11px] text-slate-500">{meta}</p>
      </div>
      <p className="font-[var(--font-geist-mono)] text-xs text-slate-300">{val}</p>
    </div>
  )
}

function ToggleRow({
  icon: Icon,
  name,
  on,
  meta,
}: {
  icon: typeof Bell
  name: string
  on: boolean
  meta: string
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 last:mb-0">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-emerald-400" />
        <div>
          <p className="text-sm">{name}</p>
          <p className="text-[11px] text-slate-500">{meta}</p>
        </div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${on ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"}`}>
        {on ? "on" : "off"}
      </span>
    </div>
  )
}

function Onto({ n, d }: { n: string; d: string }) {
  return (
    <div className="flex-1 rounded-xl border border-white/10 px-3 py-4">
      <p className="text-sm font-medium text-slate-100">{n}</p>
      <p className="mt-1 text-[11px] text-slate-500">{d}</p>
    </div>
  )
}
