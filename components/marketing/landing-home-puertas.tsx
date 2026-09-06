"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  HelpCircle,
  Lock,
  MessageSquare,
  Package,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wrench,
  Users,
  Zap,
  PartyPopper,
  Home,
  GraduationCap,
  Car,
  Droplets,
  Stethoscope,
  Truck,
  Menu,
  X,
} from "lucide-react"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { PactarImplementacionArca } from "@/components/comercial/pactar-implementacion-arca"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PUERTAS_ESCALA_RAPIDA } from "@/lib/comercial/puertas-catalog"
import { PACKS_ESPECIALISTAS } from "@/lib/servicios-especialista/especialista-catalog"

/**
 * Landing Home Corporativa para Comercios, Oficios y PyMEs de Argentina.
 * Diseño estructurado, de alta credibilidad, con llamadas a la acción claras y foco en resolución de problemas reales.
 */
export function LandingHomePuertas() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div data-page="landing" className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-50 antialiased">
      {/* ── Top Header Corporativo ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 flex items-center gap-2" aria-label="Claver Home">
              <BrandLogo size="sm" theme="dark" variant="group-full" />
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Argentina
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="#soluciones" className="hover:text-white transition">Soluciones</a>
            <a href="#como-funciona" className="hover:text-white transition">Cómo funciona</a>
            <a href="#seguridad" className="hover:text-white transition">Seguridad & AFIP</a>
            <a href="#faq" className="hover:text-white transition">Preguntas</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="lg" className="min-h-12 text-slate-300 hover:text-white hover:bg-slate-900" asChild>
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
            <Button
              size="lg"
              className="min-h-12 bg-emerald-500 font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
              asChild
            >
              <Link href="/login/register?activar=pos.core">
                Empezar gratis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <button type="button" className="ml-auto inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg text-white md:hidden" onClick={() => setNavOpen((open) => !open)} aria-expanded={navOpen} aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}>
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {navOpen && (
          <nav className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden" aria-label="Menú móvil">
            <div className="flex flex-col gap-1">
              <a href="#soluciones" onClick={() => setNavOpen(false)} className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200">Soluciones</a>
              <a href="#como-funciona" onClick={() => setNavOpen(false)} className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200">Cómo funciona</a>
              <a href="#seguridad" onClick={() => setNavOpen(false)} className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200">Seguridad</a>
              <Link href="/login" onClick={() => setNavOpen(false)} className="min-h-12 rounded-lg px-3 py-3 text-sm text-slate-200">Ya tengo cuenta</Link>
              <Link href="/login/register?activar=pos.core" onClick={() => setNavOpen(false)} className="min-h-12 rounded-lg bg-emerald-500 px-3 py-3 text-center text-sm font-semibold text-slate-950">Empezar gratis</Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* ── Hero Tier A: ferretería → servicios → gym ── */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.15),transparent)]" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Software para PyMEs de mostrador y servicios · Sin tarjeta
              </p>
              <h1 className="mt-6 font-[var(--font-fraunces)] text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Stock, venta y cobro. Sin planilla eterna.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-300 sm:text-xl">
                Empezá por ferretería, oficios o gym. El resto lo sumás después.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <span>1 minuto</span><span aria-hidden>·</span><span>Sin tarjeta</span><span aria-hidden>·</span><span>Sin promesa ERP full</span>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-slate-300">
                <a href="#puerta-servicios" className="underline decoration-slate-600 underline-offset-4 hover:text-white">¿Sos oficios?</a>
                <a href="#puerta-gym" className="underline decoration-slate-600 underline-offset-4 hover:text-white">¿Tenés gym?</a>
              </div>
            </div>

            <div id="soluciones" className="mt-12 grid gap-6 md:grid-cols-3">
              <div id="puerta-ferreteria" className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur transition hover:border-emerald-500/50 sm:p-8">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><Store className="h-6 w-6" /></div>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-300">Ferretería</Badge>
                </div>
                <h2 className="mt-5 font-[var(--font-fraunces)] text-2xl font-semibold text-white">Stock y venta en el mostrador</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">Buscá por código, vendé rápido y anotá quién te debe en cuenta corriente simple.</p>
                <p className="mt-4 text-xs text-slate-400">1 minuto · Mostrador + stock + cuenta corriente</p>
                <Button size="lg" className="mt-8 min-h-12 w-full bg-emerald-500 font-semibold text-slate-950 shadow-md hover:bg-emerald-400" asChild>
                  <Link href="/login/register?activar=pos.core">Empezar gratis<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              <div id="puerta-servicios" className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur transition hover:border-blue-500/50 sm:p-8">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400"><ClipboardList className="h-6 w-6" /></div>
                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-300">Servicios</Badge>
                </div>
                <h2 className="mt-5 font-[var(--font-fraunces)] text-2xl font-semibold text-white">Cotizá, anotás la seña y cobrá</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">Presupuesto en minutos, seña registrada y cuentas por cobrar. El link de cobro lo sumás cuando haga falta.</p>
                <p className="mt-4 text-xs text-slate-400">Presupuesto + seña + cobranza · No es OT de campo</p>
                <Button size="lg" className="mt-8 min-h-12 w-full bg-blue-500 font-semibold text-slate-950 shadow-md hover:bg-blue-400" asChild>
                  <Link href="/claver/apps/servicios">Empezar gratis<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              <div id="puerta-gym" className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur transition hover:border-purple-500/50 sm:p-8">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400"><Dumbbell className="h-6 w-6" /></div>
                  <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-xs font-medium text-purple-300">Gym</Badge>
                </div>
                <h2 className="mt-5 font-[var(--font-fraunces)] text-2xl font-semibold text-white">Socios, cuotas y morosos</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">Planes claros, quién no pagó este mes y cobro manual cuando corresponda.</p>
                <p className="mt-4 text-xs text-slate-400">Membresías + morosos · Cobro manual</p>
                <Button size="lg" className="mt-8 min-h-12 w-full bg-purple-500 font-semibold text-slate-950 shadow-md hover:bg-purple-400" asChild>
                  <Link href="/demo/gimnasio">Empezar gratis<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        {/* ── Franja de Confianza & Seguridad Corporativa ── */}
        <section id="seguridad" className="border-b border-slate-800/80 bg-slate-900/60 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Datos Seguros & Aislados</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Aislamiento empresarial y copias de seguridad automáticas.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Receipt className="h-6 w-6 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Factura oficial AFIP cuando la necesites.</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Vendé con ticket interno desde el día uno. La factura oficial AFIP se agenda cuando la necesitás.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="h-6 w-6 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Celu, Tablet & PC</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Funciona en cualquier dispositivo sin instalaciones pesadas.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-white">WhatsApp y Mercado Pago</h3>
                  <p className="text-xs text-slate-400 mt-0.5">No vienen en el gratis. Se pactan cuando el negocio ya está andando.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Cómo Funciona en 3 Pasos ── */}
        <section id="como-funciona" className="border-b border-slate-800/80 bg-slate-950 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-white sm:text-4xl">
                Cómo empezar en 3 pasos simples
              </h2>
              <p className="mt-3 text-slate-400 text-base sm:text-lg">
                Sin burocracia, sin contratos extensos y sin necesidad de conocimientos técnicos.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-400 border border-emerald-500/30">
                  1
                </div>
                <h3 className="mt-4 font-semibold text-lg text-white">Elegís tu rubro</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Tu cuenta se crea en 30 segundos con productos, unidades y plantillas precargadas según tu actividad.
                </p>
              </div>

              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-bold text-blue-400 border border-blue-500/30">
                  2
                </div>
                <h3 className="mt-4 font-semibold text-lg text-white">Operás desde el primer minuto</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Anotás ventas en la caja, registrás deudores o armás el primer presupuesto desde el celular.
                </p>
              </div>

              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 font-bold text-purple-400 border border-purple-500/30">
                  3
                </div>
                <h3 className="mt-4 font-semibold text-lg text-white">Escalás cuando tu PyME crece</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Sumás 2ª caja, más usuarios o factura electrónica cuando el negocio ya lo pide — no el día uno.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="arca" className="border-b border-slate-800/80 bg-slate-900/40 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Factura electrónica y WhatsApp</p>
            <h2 className="mt-3 font-[var(--font-fraunces)] text-3xl font-semibold text-white sm:text-4xl">
              Vendé ahora. El certificado se pacta.
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed text-base sm:text-lg">
              El ticket interno es gratis. Para Factura A/B/C con CAE hace falta quien tenga acceso a ARCA
              y emita el certificado. WhatsApp de cobro se agenda en el mismo turno. En Claver Cloud llega
              como pendiente de upgrade.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PactarImplementacionArca
                variant="landing"
                triggerLabel="Pactar turno ARCA / WhatsApp"
                pagina="/"
                defaultArca
                defaultWhatsapp
              />
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-slate-700 bg-slate-900/60 px-8 text-slate-200 hover:bg-slate-800 hover:text-white"
                asChild
              >
                <Link href="/login/register?activar=pos.core">Empezar con ticket interno</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Preguntas Frecuentes (FAQ) ── */}
        <section id="faq" className="border-b border-slate-800/80 bg-slate-900/40 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-white sm:text-4xl">
                Preguntas frecuentes
              </h2>
              <p className="mt-3 text-slate-400">
                Todo lo que necesitás saber antes de empezar a usar el sistema.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1" className="border-slate-800">
                  <AccordionTrigger className="text-left font-medium text-white hover:text-emerald-400 hover:no-underline">
                    ¿Realmente puedo empezar gratis sin poner tarjeta de crédito?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 leading-relaxed text-sm">
                    Sí, 100%. Podés registrarte y usar el punto de venta, la libreta de fiados y el creador de presupuestos sin ingresar ningún medio de pago. WhatsApp automático y factura electrónica no vienen en el gratis: se pactan cuando los necesitás.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2" className="border-slate-800">
                  <AccordionTrigger className="text-left font-medium text-white hover:text-emerald-400 hover:no-underline">
                    ¿Cómo funciona la facturación electrónica AFIP?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 leading-relaxed text-sm">
                    El sistema emite tickets internos de control de forma ilimitada. Cuando necesitás una factura oficial AFIP (A, B o C), pactás un turno para emitirla. Mientras tanto seguís vendiendo.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3" className="border-slate-800">
                  <AccordionTrigger className="text-left font-medium text-white hover:text-emerald-400 hover:no-underline">
                    ¿Qué pasa si cambio de celular o computadora?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 leading-relaxed text-sm">
                    Tus datos están resguardados de forma segura en la nube. Simplemente iniciás sesión con tu usuario y contraseña en tu nuevo dispositivo y tenés toda tu información, saldo de clientes y stock al instante.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4" className="border-slate-800">
                  <AccordionTrigger className="text-left font-medium text-white hover:text-emerald-400 hover:no-underline">
                    ¿Mis empleados pueden usar el sistema sin ver los números del negocio?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 leading-relaxed text-sm">
                    Sí. Podés asignar roles de cajero o vendedor con PIN individual. El personal solo ve la pantalla de cobro y arqueo ciego, sin acceso a tus costos, ganancias totales ni configuración del negocio.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* ── Cierre Corporativo & Llamada Final ── */}
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60 px-4 py-16 text-center sm:py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-white sm:text-5xl">
              Sumate a los negocios que ya ordenaron su gestión
            </h2>
            <p className="mt-4 text-base sm:text-xl text-slate-300">
              Probá Claver hoy mismo sin costo. Tu negocio en el celular, simple y profesional.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="min-h-12 h-12 bg-emerald-500 px-8 text-base font-semibold text-slate-950 hover:bg-emerald-400 shadow-lg"
                asChild
              >
                <Link href="/login/register?activar=pos.core">
                  Empezar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-12 h-12 border-slate-700 bg-slate-900/60 px-8 text-base text-slate-200 hover:bg-slate-800 hover:text-white"
                asChild
              >
                <Link href="/claver/apps">Ver catálogo completo de apps</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer Corporativo ── */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Grupo Claver. Software de gestión y cobro para la República Argentina.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/terminos" className="hover:text-slate-200 transition">Términos</Link>
            <Link href="/legal/privacidad" className="hover:text-slate-200 transition">Privacidad</Link>
            <Link href="/claver/partners" className="hover:text-slate-200 transition">Programa Partners</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}


