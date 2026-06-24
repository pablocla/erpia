"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Check,
  ChevronRight,
  Menu,
  Sparkles,
  X,
  Zap,
  Shield,
  MapPin,
  Play,
  ExternalLink,
} from "lucide-react"
import { CLAVERP_PRODUCT, CLAVER_GROUP } from "@/lib/marketing/brand-system"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { cn } from "@/lib/utils"
import {
  ADDONS,
  FAQ_ITEMS,
  FLOW_STEPS,
  MODULO_CATEGORIAS,
  MODULO_STATS,
  NAV_SECTIONS,
  PRICING_PLANS,
  RUBROS,
} from "@/lib/marketing/modulos-catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  MotionFadeDown,
  MotionList,
  MotionListItem,
  MotionNumber,
  ScrollReveal,
} from "@/components/ui/motion"
import { useToast } from "@/hooks/use-toast"

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

const BG_LIGHT =
  "bg-[radial-gradient(circle_at_top,_rgba(248,246,241,0.95),_transparent_50%),_linear-gradient(160deg,_#f8f8f6_0%,_#eef4f8_50%,_#f5f0ff_100%)]"

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function ModulosLanding() {
  const { toast } = useToast()
  const [navOpen, setNavOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [scrolled, setScrolled] = useState(false)
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "" })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const filteredModulos = useMemo(() => {
    if (activeCategory === "all") return MODULO_CATEGORIAS
    return MODULO_CATEGORIAS.filter((m) => m.id === activeCategory)
  }, [activeCategory])

  const handleContact = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!form.nombre.trim() || !form.email.trim()) {
        toast({ title: "Completá nombre y email", variant: "destructive" })
        return
      }
      toast({
        title: "¡Gracias!",
        description: "Te contactamos en menos de 24 hs hábiles.",
      })
      setForm({ nombre: "", email: "", telefono: "", mensaje: "" })
    },
    [form, toast],
  )

  return (
    <div className="min-h-screen text-slate-900">
      {/* ─── Nav ─── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-lg shadow-black/10"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/claver/claverp" className="flex items-center gap-2">
            <BrandLogo size="sm" theme="dark" variant="claverp-full" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToId(s.id)}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button
              className="bg-white text-slate-900 shadow-lg hover:bg-slate-100"
              asChild
            >
              <Link href="/login">
                Probar demo
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Menú"
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {navOpen && (
          <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    scrollToId(s.id)
                    setNavOpen(false)
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/10"
                >
                  {s.label}
                </button>
              ))}
              <Button className="mt-2" asChild>
                <Link href="/login">Probar demo</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-28 text-white sm:pt-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-violet-600/30 blur-[120px]" />
          <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-fuchsia-500/25 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeDown className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 border-violet-400/30 bg-violet-500/20 px-4 py-1.5 text-violet-200">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              40+ módulos · Un solo sistema · Hecho en Argentina
            </Badge>

            <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              El ERP que{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                unifica
              </span>{" "}
              tu operación entera
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              POS, factura AFIP, stock, ecommerce, logística, industria, agro e IA — configurado
              para tu rubro en minutos. Sin Excel. Sin sistemas pegados con cinta.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 min-w-[200px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-base shadow-xl shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500"
                asChild
              >
                <Link href="/login">
                  <Play className="mr-2 h-4 w-4" />
                  Probar demo gratis
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 min-w-[200px] border-white/20 bg-white/5 text-base text-white hover:bg-white/10"
                onClick={() => scrollToId("modulos")}
              >
                Ver todos los módulos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </MotionFadeDown>

          {/* Stats */}
          <MotionList className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {MODULO_STATS.map((stat) => (
              <MotionListItem key={stat.label}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-sm">
                  <div className="font-[var(--font-fraunces)] text-3xl font-semibold sm:text-4xl">
                    <MotionNumber value={stat.value} />
                    {stat.suffix}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 sm:text-sm">{stat.label}</div>
                </div>
              </MotionListItem>
            ))}
          </MotionList>

          {/* Floating pills */}
          <div className="mt-16 flex flex-wrap justify-center gap-2">
            {["POS", "AFIP", "Ecommerce", "Picking", "IoT", "IA", "Agro", "KDS"].map((pill, i) => (
              <motion.span
                key={pill}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400"
              >
                {pill}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Módulos grid ─── */}
      <section id="modulos" className={cn("scroll-mt-20 px-4 py-24 sm:px-6", BG_LIGHT)}>
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <Badge variant="secondary" className="mb-4">
              Catálogo completo
            </Badge>
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl md:text-5xl">
              Cada módulo habla con el resto
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Un pedido online descuenta stock, genera picking, emite remito y factura AFIP sin
              reingresar datos. Eso es lo que vendemos: continuidad operativa.
            </p>
          </ScrollReveal>

          <ScrollReveal className="mt-10">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  activeCategory === "all"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white/80 text-slate-600 hover:bg-white",
                )}
              >
                Todos ({MODULO_CATEGORIAS.length})
              </button>
              {MODULO_CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    activeCategory === cat.id
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-white/80 text-slate-600 hover:bg-white",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModulos.map((mod, i) => (
              <ScrollReveal key={mod.id} style={{ transitionDelay: `${i * 40}ms` }}>
                <Card
                  className={cn(
                    "group relative h-full overflow-hidden border-white/70 bg-white/80 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:shadow-[0_35px_80px_-40px_rgba(15,23,42,0.45)]",
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-100",
                      mod.gradient,
                    )}
                  />
                  <CardHeader className="relative space-y-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                          mod.gradient,
                        )}
                      >
                        <mod.icon className={cn("h-5 w-5", mod.color)} />
                      </div>
                      {mod.badge && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase tracking-wider"
                        >
                          {mod.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="font-[var(--font-fraunces)] text-xl text-slate-900">
                      {mod.label}
                    </CardTitle>
                    <p className="text-sm text-slate-600">{mod.tagline}</p>
                  </CardHeader>
                  <CardContent className="relative">
                    <ul className="space-y-2">
                      {mod.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Ecommerce spotlight ─── */}
      <section
        id="canales"
        className="scroll-mt-20 bg-slate-950 px-4 py-24 text-white sm:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <Badge className="mb-4 border-teal-400/30 bg-teal-500/20 text-teal-200">
                Ecommerce integrado
              </Badge>
              <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold sm:text-4xl md:text-5xl">
                Tu tienda online con el mismo stock que el mostrador
              </h2>
              <p className="mt-4 text-slate-400">
                Tienda B2C para consumidor final. Portal B2B con precios por lista y cuenta
                corriente. Mercado Libre y Mercado Pago como add-ons. Todo conectado al ERP.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  className="bg-teal-600 hover:bg-teal-500"
                  asChild
                >
                  <Link href="/tienda?empresaId=1">
                    Ver tienda demo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10"
                  asChild
                >
                  <Link href="/portal?empresa=1">
                    Portal mayorista
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-teal-500/20 to-violet-500/20 blur-2xl" />
                <Card className="relative border-white/10 bg-white/5 backdrop-blur-sm">
                  <CardContent className="space-y-4 p-6">
                    {[
                      { label: "Catálogo público", desc: "Stock y precios en tiempo real" },
                      { label: "Checkout sin login", desc: "Pedido → reserva automática" },
                      { label: "Portal con CUIT", desc: "Lista de precios del cliente" },
                      { label: "ML + MP + WhatsApp", desc: "Canales como add-ons" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20">
                          <Check className="h-5 w-5 text-teal-400" />
                        </div>
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-slate-400">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Flujo operativo ─── */}
      <section id="flujo" className={cn("scroll-mt-20 px-4 py-24 sm:px-6", BG_LIGHT)}>
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
              De la venta al cobro, sin cortes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Un circuito real que ya está cableado en el código — no es un diagrama de marketing.
            </p>
          </ScrollReveal>

          <div className="mt-14 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
            {FLOW_STEPS.map((step, i) => (
              <ScrollReveal key={step.label} className="flex flex-1 flex-col items-center">
                <div className="relative flex w-full flex-col items-center">
                  {i < FLOW_STEPS.length - 1 && (
                    <div className="absolute left-[calc(50%+28px)] top-7 hidden h-0.5 w-[calc(100%-56px)] bg-gradient-to-r from-violet-300 to-fuchsia-300 lg:block" />
                  )}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="font-semibold text-slate-900">{step.label}</div>
                    <div className="text-sm text-slate-500">{step.sub}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-16">
            <Card className="border-red-200/60 bg-gradient-to-r from-red-50 to-orange-50">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                  <Shield className="h-7 w-7 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-[var(--font-fraunces)] text-xl font-semibold text-slate-900">
                    100% Argentina — AFIP nativo
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    IVA 21%, CUIT, puntos de venta, CAE, CAEA contingencia, IIBB, CITI y MiPyME
                    FCE. No es un ERP importado adaptado con parches.
                  </p>
                </div>
                <Badge className="shrink-0 bg-red-600 hover:bg-red-600">Homologación + Producción</Badge>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Rubros ─── */}
      <section id="rubros" className="scroll-mt-20 bg-slate-900 px-4 py-24 text-white sm:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <ScrollReveal>
            <Badge className="mb-4 border-amber-400/30 bg-amber-500/20 text-amber-200">
              <Sparkles className="mr-1 h-3 w-3" />
              Onboarding IA
            </Badge>
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold sm:text-4xl">
              Configurado para tu rubro en 5 minutos
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              El asistente activa módulos, oculta lo que no necesitás y deja el ERP listo para operar.
            </p>
          </ScrollReveal>

          <ScrollReveal className="mt-12">
            <div className="flex flex-wrap justify-center gap-3">
              {RUBROS.map((r) => (
                <div
                  key={r.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
                >
                  <span className="mr-2">{r.emoji}</span>
                  {r.label}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="precios" className={cn("scroll-mt-20 px-4 py-24 sm:px-6", BG_LIGHT)}>
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
              Planes simples, módulos potentes
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-600">
              Precios en pesos argentinos. Trial de 14 días. Sin permanencia.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <ScrollReveal key={plan.id}>
                <Card
                  className={cn(
                    "relative h-full overflow-hidden border-white/70 bg-white/80",
                    plan.highlighted &&
                      "border-violet-300 shadow-[0_30px_80px_-40px_rgba(124,58,237,0.45)] ring-2 ring-violet-400/50",
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  )}
                  <CardHeader>
                    {plan.highlighted && (
                      <Badge className="mb-2 w-fit bg-violet-600">Más elegido</Badge>
                    )}
                    <CardTitle className="font-[var(--font-fraunces)] text-2xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="font-[var(--font-fraunces)] text-4xl font-semibold">
                        {currency.format(plan.price)}
                      </span>
                      <span className="text-slate-500">/mes</span>
                    </div>
                    <p className="text-sm text-slate-600">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={cn(
                        "w-full",
                        plan.highlighted &&
                          "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500",
                      )}
                      variant={plan.highlighted ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/login">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-12">
            <p className="mb-4 text-center text-sm font-medium text-slate-700">Add-ons opcionales</p>
            <div className="flex flex-wrap justify-center gap-3">
              {ADDONS.map((addon) => (
                <div
                  key={addon.name}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
                >
                  <addon.icon className="h-4 w-4 text-violet-600" />
                  <span className="font-medium">{addon.name}</span>
                  <span className="text-slate-500">desde {currency.format(addon.price)}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="scroll-mt-20 bg-white px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
              Preguntas frecuentes
            </h2>
          </ScrollReveal>

          <ScrollReveal className="mt-10">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-medium text-slate-900">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── CTA + Contact ─── */}
      <section className="bg-slate-950 px-4 py-24 text-white sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <h2 className="font-[var(--font-fraunces)] text-3xl font-semibold sm:text-4xl">
              ¿Listo para dejar de pelear con Excel?
            </h2>
            <p className="mt-4 text-slate-400">
              Probá la demo ahora o dejanos tus datos y te armamos una propuesta según tu rubro y
              tamaño de operación.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
                asChild
              >
                <Link href="/login">
                  Entrar a la demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10"
                asChild
              >
                <Link href="/tienda?empresaId=1">Ver tienda</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              Diseñado para PyMEs argentinas · Soporte en español
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Contacto comercial</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContact} className="space-y-4">
                  <Input
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Input
                    placeholder="Teléfono (opcional)"
                    value={form.telefono}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Textarea
                    placeholder="Contanos tu rubro y qué necesitás..."
                    value={form.mensaje}
                    onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    rows={3}
                  />
                  <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-100">
                    Quiero que me contacten
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <footer className="mx-auto mt-20 max-w-7xl border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} {CLAVER_GROUP.name} · {CLAVERP_PRODUCT.name}. Todos los derechos reservados.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            <Link href="/login" className="hover:text-slate-300">
              Login
            </Link>
            <Link href="/tienda?empresaId=1" className="hover:text-slate-300">
              Tienda
            </Link>
            <Link href="/portal?empresa=1" className="hover:text-slate-300">
              Portal B2B
            </Link>
          </div>
        </footer>
      </section>
    </div>
  )
}