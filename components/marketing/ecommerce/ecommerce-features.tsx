"use client"

import { Check, X, ShoppingCart, Users, ArrowRight, ClipboardList, FileText, RefreshCw, CreditCard, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/motion"

export function EcommerceFeatures() {
  const problemSolutions = [
    {
      problem: "Pedidos por WhatsApp sin control",
      solution: "Pedido formal con número único, trazabilidad y estado en vivo."
    },
    {
      problem: "Stock desactualizado y ventas sin stock",
      solution: "Mismo stock en el POS físico del mostrador, depósitos y ecommerce."
    },
    {
      problem: "Facturación manual pesada post-venta",
      solution: "Circuito continuo: pedido validado → remito → factura AFIP sin reingresar nada."
    }
  ]

  const rubros = [
    { label: "Distribuidoras", emoji: "🏢", desc: "Portal B2B, cuentas corrientes y listas mayoristas." },
    { label: "Autopartes y Ferreterías", emoji: "🔧", desc: "Miles de SKUs con búsqueda rápida e imágenes." },
    { label: "Librerías e Indumentaria", emoji: "📚", desc: "Control de talles, colores y combos promocionales." },
    { label: "Supermercados y Alimentos", emoji: "🛒", desc: "Control de lotes, vencimientos y envíos propios." },
    { label: "Farmacia y Cosmética", emoji: "🧴", desc: "Lotes específicos y stock distribuido." }
  ]

  return (
    <section className="space-y-24 py-16 md:py-24 bg-slate-50/50">
      
      {/* 1. Antes vs Después (Problema -> Solución) */}
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-slate-350 bg-slate-100 text-slate-800">
            Comparación de Operación
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
            Dejá de pelear con sistemas desconectados
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-650">
            Mirá la diferencia entre vender de forma manual y centralizar tus canales en una sola plataforma.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            {/* Antes (Problema) */}
            <div className="p-8 bg-slate-50/30">
              <h3 className="flex items-center gap-2 font-[var(--font-fraunces)] text-lg font-bold text-slate-700">
                <X className="h-5 w-5 text-red-500" />
              <span>Antes (El día a día manual)</span>
              </h3>
              <ul className="mt-6 space-y-4">
                {problemSolutions.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-600 text-sm">
                    <span className="font-semibold text-slate-400">0{idx + 1}.</span>
                    <span>{item.problem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Con ERP (Solución) */}
            <div className="p-8 bg-white">
              <h3 className="flex items-center gap-2 font-[var(--font-fraunces)] text-lg font-bold text-emerald-800">
                <Check className="h-5 w-5 text-emerald-500" />
                <span>Con Clavis Ecommerce</span>
              </h3>
              <ul className="mt-6 space-y-4">
                {problemSolutions.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-800 text-sm">
                    <span className="font-semibold text-emerald-600">0{idx + 1}.</span>
                    <span>{item.solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. Dos productos en uno (B2C y B2B) */}
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-amber-200/60 bg-amber-500/10 text-amber-800">
            Dos Soluciones, Una Plataforma
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
            Cubrí todos tus canales de venta digital
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-650">
            Diferenciá la experiencia de tus clientes de consumo final de tus distribuidores mayoristas.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* B2C Card */}
          <Card className="border-white/70 bg-white/80 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.3)]">
            <CardHeader className="space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <CardTitle className="font-[var(--font-fraunces)] text-2xl text-slate-900">
                Tienda Minorista B2C
              </CardTitle>
              <p className="text-sm text-slate-500">Para venta abierta a todo público.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Catálogo público con búsqueda inteligente y filtros avanzados",
                  "Carrito de compras intuitivo y checkout rápido sin requerir login",
                  "Validación de stock disponible al instante antes del pago",
                  "Motor de precios integrado (aplica descuentos y promociones en vivo)",
                  "Impuestos e IVA 21% calculados automáticamente en la orden"
                ].map((feat, idx) => (
                  <li key={idx} className="flex gap-2.5 text-slate-700 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* B2B Card */}
          <Card className="border-white/70 bg-white/80 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.3)]">
            <CardHeader className="space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="font-[var(--font-fraunces)] text-2xl text-slate-900">
                Portal Mayorista B2B
              </CardTitle>
              <p className="text-sm text-slate-500">Para clientes registrados y distribuidores.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Acceso exclusivo y validado por CUIT/contraseña de cliente",
                  "Lista de precios mayorista asignada dinámicamente al ingresar",
                  "Consulta de cuenta corriente, saldos y límite de crédito",
                  "Historial completo de pedidos anteriores y sus estados de despacho",
                  "Re-pedido ultra rápido en 2 clics desde compras históricas"
                ].map((feat, idx) => (
                  <li key={idx} className="flex gap-2.5 text-slate-700 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {/* 3. Flujo operativo (Diagrama Visual) */}
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="border-slate-350 bg-slate-100 text-slate-800">
            Circuito Integrado
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
            Tus pedidos fluyen solos
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-650">
            El flujo operativo del pedido online se conecta de punta a punta con el ERP y los depósitos.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          {[
            { label: "Compra Online", sub: "B2C o B2B", icon: ShoppingCart },
            { label: "Reserva de Stock", sub: "En tiempo real", icon: RefreshCw },
            { label: "Picking en Depósito", sub: "Control por código", icon: ClipboardList },
            { label: "Remito y Despacho", sub: "Hoja de ruta", icon: FileText },
            { label: "Factura AFIP + Cobro", sub: "Emisión de CAE", icon: CreditCard }
          ].map((step, idx, arr) => (
            <div key={step.label} className="relative flex flex-1 flex-col items-center p-4">
              {/* Conector horizontal para pantallas grandes */}
              {idx < arr.length - 1 && (
                <div className="absolute left-[calc(50%+28px)] top-10 hidden h-[2px] w-[calc(100%-56px)] bg-slate-200 lg:block" />
              )}
              
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm font-bold text-slate-950">{step.label}</div>
                <div className="text-xs text-slate-500 mt-1">{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* 4. Rubros ideales */}
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-white/60 bg-white/70 p-8 md:p-12 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.2)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-800">
                <Sparkles className="h-3 w-3 text-amber-600 animate-pulse" />
                <span>Onboarding Inteligente</span>
              </div>
              <h3 className="font-[var(--font-fraunces)] text-2xl font-bold text-slate-900 md:text-3xl">
                ¿Tu rubro tiene reglas específicas?
              </h3>
              <p className="text-sm text-slate-650 leading-relaxed">
                El onboarding de IA configura el ERP y la tienda en 5 minutos para adaptarse a tu negocio. Oculta lo innecesario y potencia tus fortalezas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {rubros.map((rubro) => (
                <div
                  key={rubro.label}
                  className="rounded-xl border border-slate-100 bg-white p-4 transition-all hover:shadow-sm"
                >
                  <span className="text-xl block mb-2">{rubro.emoji}</span>
                  <div className="text-sm font-semibold text-slate-950">{rubro.label}</div>
                  <div className="text-[11px] text-slate-550 mt-1 leading-relaxed">{rubro.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </ScrollReveal>

    </section>
  )
}
