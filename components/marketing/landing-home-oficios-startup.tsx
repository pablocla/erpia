"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  Mic,
  Package,
  Play,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
  Volume2,
  Wrench,
  Zap,
} from "lucide-react"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function LandingHomeOficiosStartup() {
  const [activeTier, setActiveTier] = useState<"basico" | "recomendado" | "premium">("recomendado")
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [depositApproved, setDepositApproved] = useState(false)

  const handleSimulatePlay = () => {
    setAudioPlaying(true)
    setTimeout(() => {
      setAudioPlaying(false)
    }, 2500)
  }

  return (
    <div data-page="landing-startup" className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* ── Top Header Moderno & Navigation Hub ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 flex items-center gap-2" aria-label="Claver Home">
              <BrandLogo size="sm" theme="dark" variant="group-full" />
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Global / Argentina
            </span>
          </div>

          {/* Menú de Soluciones por Vertical */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-white transition py-2">
                <span>Soluciones</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-0 hidden w-72 pt-2 group-hover:block">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl space-y-1">
                  <Link href="/" className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-800/80 transition group/item">
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 group-hover/item:bg-emerald-500 group-hover/item:text-slate-950 transition">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        Oficios & Obras
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300">Principal</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Presupuestos por voz y señas online</div>
                    </div>
                  </Link>
                  <Link href="/f" className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-800/80 transition group/item">
                    <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400 group-hover/item:bg-sky-500 group-hover/item:text-slate-950 transition">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Comercios & POS</div>
                      <div className="text-[11px] text-slate-400">Punto de venta, stock y fiados</div>
                    </div>
                  </Link>
                  <Link href="/arca" className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-800/80 transition group/item">
                    <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 group-hover/item:bg-amber-500 group-hover/item:text-slate-950 transition">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Facturación ARCA / AFIP</div>
                      <div className="text-[11px] text-slate-400">Comprobantes oficiales en 1 clic</div>
                    </div>
                  </Link>
                  <Link href="/claver/apps/gastronomia" className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-800/80 transition group/item">
                    <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400 group-hover/item:bg-rose-500 group-hover/item:text-slate-950 transition">
                      <UtensilsCrossed className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Gastronomía & KDS</div>
                      <div className="text-[11px] text-slate-400">Mesas, comandas y pantalla de cocina</div>
                    </div>
                  </Link>
                  <div className="border-t border-slate-800 pt-1.5 mt-1.5">
                    <Link href="/explorar" className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition">
                      <span>Ver todo el catálogo (40+ módulos)</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <a href="#como-funciona" className="hover:text-white transition">Cómo funciona</a>
            <a href="#beneficios" className="hover:text-white transition">Herramientas</a>
            <a href="#arca-accesorio" className="hover:text-white transition">Facturación ARCA</a>
            <a href="#faq" className="hover:text-white transition">Preguntas</a>
          </nav>

          {/* Actions Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-900" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 font-semibold text-slate-950 shadow-md shadow-emerald-950/40 hover:bg-emerald-400 transition"
              asChild
            >
              <Link href="/f/servicios">
                Crear Presupuesto Gratis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Principal Startup ── */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32">
          {/* Luces de fondo y gradient glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.22),transparent)]" aria-hidden />
          <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full" aria-hidden />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Transcripción de audio a presupuesto · Sin tarjeta de crédito
              </div>

              <h1 className="mt-6 font-[var(--font-fraunces)] text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
                De una nota de voz a un presupuesto formal con seña.
                <span className="block text-emerald-400">Sin perder tiempo tipeando.</span>
              </h1>

              <p className="mt-5 text-lg text-slate-300 leading-relaxed sm:text-xl">
                Pensado para electricistas, plomeros, instaladores y contratistas. Grabás un audio detallando el trabajo y el sistema desglosa los ítems, organiza los costos y crea una propuesta en 3 opciones para enviar por WhatsApp con cobro de seña online.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 bg-emerald-500 font-semibold text-slate-950 text-base shadow-xl shadow-emerald-950/60 hover:bg-emerald-400 transition"
                  asChild
                >
                  <Link href="/f/servicios">
                    <Mic className="mr-2 h-5 w-5" />
                    Armar Presupuesto por Voz Gratis
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                  onClick={handleSimulatePlay}
                >
                  <Play className="mr-2 h-4 w-4 text-emerald-400" />
                  Ver Ejemplo Interactivo
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% desde el celular
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sin instalar aplicaciones pesadas
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cobro de seña directo en WhatsApp
                </span>
              </div>
            </div>

            {/* ── Widget Interactivo en Vivo (El "Aha! Moment") ── */}
            <div id="como-funciona" className="mt-14 mx-auto max-w-4xl">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Ejemplo de trabajo real</div>
                      <div className="text-sm font-semibold text-white">Obra: Depto 4B · Instalación Eléctrica & Climatización</div>
                    </div>
                  </div>

                  {/* Reproductor de Audio Simulado */}
                  <button
                    onClick={handleSimulatePlay}
                    className={`flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-medium transition ${
                      audioPlaying
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                        : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Volume2 className={`h-4 w-4 text-emerald-400 ${audioPlaying ? "animate-pulse" : ""}`} />
                    <span>{audioPlaying ? "Escuchando audio..." : 'Escuchar audio: "3 aires y cableado..."'}</span>
                    <Play className="h-3 w-3 fill-current text-emerald-400" />
                  </button>
                </div>

                {/* 3 Opciones de Presupuesto Estructuradas por IA */}
                <div className="mt-6">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Propuesta estructurada a partir del audio (3 niveles):</span>
                    <span className="text-emerald-400 font-semibold">Alternativas transparentes para el cliente</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Nivel Básico */}
                    <div
                      onClick={() => setActiveTier("basico")}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        activeTier === "basico"
                          ? "border-emerald-500 bg-emerald-950/20 shadow-md"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs text-slate-400 font-medium">Opción 1</div>
                      <div className="text-sm font-semibold text-white mt-0.5">Básico</div>
                      <div className="text-lg font-bold text-slate-200 mt-2">$85.000</div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Mano de obra directa. Materiales a cargo del propietario.</p>
                    </div>

                    {/* Nivel Recomendado (Favorito) */}
                    <div
                      onClick={() => setActiveTier("recomendado")}
                      className={`cursor-pointer rounded-2xl border p-4 relative transition ${
                        activeTier === "recomendado"
                          ? "border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400 shadow-xl shadow-emerald-950/30"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                        ⭐ Opción estándar
                      </span>
                      <div className="text-xs text-emerald-400 font-medium">Opción 2</div>
                      <div className="text-sm font-semibold text-white mt-0.5">Recomendado</div>
                      <div className="text-xl font-bold text-emerald-400 mt-2">$135.000</div>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">Mano de obra + térmicas Siemens + cables normalizados IRAM.</p>
                    </div>

                    {/* Nivel Premium */}
                    <div
                      onClick={() => setActiveTier("premium")}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        activeTier === "premium"
                          ? "border-emerald-500 bg-emerald-950/20 shadow-md"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs text-slate-400 font-medium">Opción 3</div>
                      <div className="text-sm font-semibold text-white mt-0.5">Premium Llave en Mano</div>
                      <div className="text-lg font-bold text-slate-200 mt-2">$195.000</div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Todo incluido + garantía extendida 12 meses y certificación.</p>
                    </div>
                  </div>
                </div>

                {/* Seña Online y Aprobación */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Seña acordada (40%)</div>
                      <div className="text-sm font-bold text-white">
                        {activeTier === "basico" ? "$34.000" : activeTier === "recomendado" ? "$54.000" : "$78.000"} ARS
                      </div>
                    </div>
                  </div>

                  {depositApproved ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ¡Seña abonada por el cliente vía Mercado Pago!
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setDepositApproved(true)}
                      className="bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 w-full sm:w-auto"
                    >
                      Simular Confirmación de Seña
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* ── El Problema Real vs Cómo lo Resolvés con 1 Audio ── */}
                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7 text-left space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                      <span>❌ El problema de todos los días:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Terminás una visita técnica a las 19hs con las manos sucias y el cliente te dice: <em>"Pasame el presupuesto por WhatsApp"</em>. Llegás a tu casa cansado, te da pereza prender la computadora para armar un Word o calcular a mano y terminás pasando un número suelto o tardando 3 días. El cliente regatea o contrata a otro.
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-5">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>✅ Cómo lo resolvés en 1 minuto antes de subirte a la camioneta:</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4 text-xs text-slate-300">
                      <div className="space-y-1 rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                        <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span>1. Hablás</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          "Hay que poner 3 aires de 3000 frigorías, pasar 15m de cable 4mm y 2 térmicas Siemens".
                        </p>
                      </div>

                      <div className="space-y-1 rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                        <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span>2. Desglosa</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          Pasa el audio a texto y arma el borrador con 3 opciones (Básico, Recomendado, Premium).
                        </p>
                      </div>

                      <div className="space-y-1 rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                        <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span>3. Vos revisás</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          La app no inventa tarifas. Vos ajustás el precio de tu mano de obra antes de enviarlo.
                        </p>
                      </div>

                      <div className="space-y-1 rounded-xl bg-slate-900/90 border border-slate-800/80 p-3">
                        <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span>4. Cobrás seña</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          Le mandás el link por WhatsApp. El cliente elige su opción y paga la seña con tarjeta.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Herramientas Concretas ── */}
        <section id="beneficios" className="border-t border-slate-800/80 bg-slate-900/40 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase tracking-wider text-xs">
                Diseñado para el ritmo de trabajo en la calle
              </Badge>
              <h2 className="mt-3 font-[var(--font-fraunces)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Tres herramientas prácticas para cotizar claro y cobrar a tiempo.
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {/* Herramienta 1 */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-lg flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Presupuestos en 3 Opciones</h3>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    Le ofrecés al cliente alternativas transparentes (ej: solo mano de obra, o mano de obra con materiales incluidos). El cliente elige según su posibilidad y se evitan negociaciones desgastantes.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Evitá regateos y aclará el alcance</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>

              {/* Herramienta 2 */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-lg flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Cobro de Seña por WhatsApp</h3>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    Le mandás un enlace profesional al cliente. Confirma la opción elegida y puede abonar la seña acordada con tarjeta o transferencia por Mercado Pago antes de que compres los materiales.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs font-semibold text-sky-400 flex items-center gap-1">
                  <span>Asegurá los materiales antes de ir a la obra</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>

              {/* Herramienta 3 */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-lg flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Control de Gastos y Cuadrilla</h3>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    Llevá el registro de los materiales comprados y los días trabajados por tus ayudantes. Sabés exactamente cuánto te dejó cada obra y tenés las liquidaciones al día.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <span>Cuentas claras y margen real</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bloque ARCA: Facturación Fiscal ── */}
        <section id="arca-accesorio" className="border-t border-slate-800/80 bg-slate-950 py-16 sm:py-20 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-8 sm:p-12 relative">
              <div className="max-w-2xl">
                <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 mb-3">
                  Facturación AFIP / ARCA Integrada
                </Badge>
                <h3 className="font-[var(--font-fraunces)] text-2xl font-bold text-white sm:text-3xl">
                  ¿El cliente te pide factura oficial?
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                  Cuando el cliente aprueba el presupuesto y abona la seña o el saldo, podés emitir la Factura oficial (A, B o C) de ARCA / AFIP al instante en PDF con código QR fiscal sin tener que ingresar a la web de AFIP.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-300 hover:bg-amber-950/30" asChild>
                    <Link href="/arca">
                      Conocer Módulo ARCA / Facturación
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparativa: Forma Antigua vs Con Claver ── */}
        <section className="border-t border-slate-800/80 bg-slate-900/30 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-[var(--font-fraunces)] text-3xl font-bold text-white">
                La diferencia en el día a día de tu trabajo
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <div className="grid grid-cols-2 bg-slate-950/80 p-4 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <div className="text-slate-400">La forma tradicional (Papel o chats desordenados)</div>
                <div className="text-emerald-400">Con Claver Oficios</div>
              </div>

              <div className="divide-y divide-slate-800/60 text-sm">
                <div className="grid grid-cols-2 p-4 gap-4">
                  <div className="text-slate-400">Llegás cansado a tu casa a las 21h a tipear presupuestos en la computadora.</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Grabás un audio al salir de la visita y tenés el borrador estructurado en 1 minuto.
                  </div>
                </div>

                <div className="grid grid-cols-2 p-4 gap-4">
                  <div className="text-slate-400">Pasás un solo monto cerrado y el cliente regatea o no responde.</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Ofrecés 3 opciones claras (Básico, Recomendado, Premium) para que el cliente elija.
                  </div>
                </div>

                <div className="grid grid-cols-2 p-4 gap-4">
                  <div className="text-slate-400">Esperás días a que el cliente te transfiera la seña para comprar materiales.</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Le enviás un link por WhatsApp y el cliente puede señar online en el momento.
                  </div>
                </div>

                <div className="grid grid-cols-2 p-4 gap-4">
                  <div className="text-slate-400">Perdés tiempo ingresando al portal de AFIP para emitir cada comprobante C.</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Emitís la factura oficial con QR fiscal con 1 clic sobre el presupuesto aprobado.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Barra de Navegación Secundaria (Otras Soluciones) ── */}
        <section className="border-t border-slate-800/80 bg-slate-950 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
              <div>
                <div className="text-sm font-semibold text-white">¿Buscás soluciones para otros rubros?</div>
                <div className="text-xs text-slate-400 mt-0.5">Tenemos sistemas especializados para cada tipo de negocio.</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                  <Link href="/f">
                    <Store className="mr-1.5 h-3.5 w-3.5 text-sky-400" />
                    Punto de Venta / Kioscos
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                  <Link href="/arca">
                    <Receipt className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                    Facturación ARCA
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                  <Link href="/explorar">
                    <Package className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                    Ver Catálogo ERP (40+ Apps)
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Acordeón ── */}
        <section id="faq" className="border-t border-slate-800/80 bg-slate-900/40 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-[var(--font-fraunces)] text-2xl font-bold text-white sm:text-3xl">
                Preguntas frecuentes de instaladores y cuadrillas
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem value="item-1" className="rounded-xl border border-slate-800 bg-slate-900/80 px-4">
                <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline">
                  ¿Realmente es gratis para arrancar?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-300 leading-relaxed">
                  Sí. Podés registrarte y armar presupuestos por voz en tu celular sin pagar nada ni ingresar tarjeta de crédito. Si decidís usar el cobro de seña online por Mercado Pago, se aplican las comisiones estándar del procesador de pagos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="rounded-xl border border-slate-800 bg-slate-900/80 px-4">
                <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline">
                  ¿El cliente necesita instalarse una app para ver el presupuesto?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-300 leading-relaxed">
                  No. Al cliente le llega un enlace web profesional por WhatsApp que abre en cualquier celular o computadora, donde puede elegir la opción que más le sirva y abonar la seña.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="rounded-xl border border-slate-800 bg-slate-900/80 px-4">
                <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline">
                  ¿Cómo funciona la transcripción por voz con Inteligencia Artificial?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-300 leading-relaxed">
                  Grabás o enviás una nota de voz detallando el trabajo. La IA procesa el audio, identifica los materiales y mano de obra mencionados y arma un borrador de presupuesto en 3 niveles. Vos mantenés el control total para ajustar precios y cantidades antes de enviarlo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="rounded-xl border border-slate-800 bg-slate-900/80 px-4">
                <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline">
                  ¿Cómo funciona la emisión de Facturas ARCA / AFIP?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-300 leading-relaxed">
                  El sistema se conecta con los servicios web oficiales de ARCA/AFIP usando tu CUIT y punto de venta. Emitís comprobantes A, B o C oficiales en PDF con código QR fiscal en un solo clic.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* ── Bottom Call to Action ── */}
        <section className="border-t border-slate-800/80 bg-gradient-to-b from-slate-950 to-emerald-950/30 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-bold text-white sm:text-4xl">
              Empezá a cotizar con claridad hoy mismo.
            </h2>
            <p className="mt-4 text-base text-slate-300">
              Armá tu primer presupuesto en pocos minutos. Sin tarjeta de crédito ni instalaciones.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="h-12 px-8 bg-emerald-500 font-semibold text-slate-950 text-base shadow-xl shadow-emerald-950/50 hover:bg-emerald-400 transition"
                asChild
              >
                <Link href="/f/servicios">
                  <Mic className="mr-2 h-5 w-5" />
                  Crear Mi Primer Presupuesto por Voz
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer Global ── */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" theme="dark" variant="group" />
            <span>© {new Date().getFullYear()} Grupo Claver Inc. Plataforma operativa para oficios y comercio.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/legal/terminos" className="hover:text-white transition">Términos</Link>
            <Link href="/legal/privacidad" className="hover:text-white transition">Privacidad</Link>
            <Link href="/arca" className="hover:text-white transition">Facturación ARCA</Link>
            <Link href="/f" className="hover:text-white transition">Punto de Venta POS</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

