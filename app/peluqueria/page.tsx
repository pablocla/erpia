import type { Metadata } from "next"
import Link from "next/link"
import { Scissors, Calendar, Wallet, MessageSquare, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Software para Peluquerías, Barberías y Estética | Claver",
  description: "Agenda de turnos online, señas automáticas por MercadoPago, comisiones de peinadores y recordatorios de WhatsApp. Probá gratis.",
  alternates: { canonical: `${siteUrl}/peluqueria` },
}

export default function PeluqueriaLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Hero Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-500/15 via-purple-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Navigation */}
      <header className="max-w-6xl mx-auto w-full px-4 py-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-amber-400 to-white bg-clip-text text-transparent">
            CLAVER
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Peluquería & Estética
          </span>
        </Link>

        <Link
          href="/onboarding/express"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20"
        >
          Probar Gratis
        </Link>
      </header>

      {/* Main Hero */}
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-center z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evitá que te dejen plantado con señas automáticas</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          El Software para Peluquerías y Estética que{" "}
          <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            cobras señas por MercadoPago
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Agenda de turnos online, cálculo automático de comisiones para tus estilistas y recordatorios por WhatsApp. Chau turnos perdidos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/onboarding/express"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 text-base"
          >
            Comenzar Gratis en 2 Minutos
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sin tarjeta de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Configuración express
          </span>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto px-4 py-12 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Seña con MercadoPago</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus clientes señan el turno directamente a tu MercadoPago para congelar la cita. Si no van, no perdés la hora.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Comisiones de Estilistas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculá automáticamente el % que le corresponde a cada peinador o barbero por servicio realizado al cierre del día.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Recordatorios por WhatsApp</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Avisos automáticos 24 horas antes del turno con link de confirmación o cancelación para reasignar la vacante.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500 z-10">
        <p>© 2026 Grupo Claver - Software para Peluquerías, Estética y Comercio en Argentina.</p>
      </footer>
    </main>
  )
}
