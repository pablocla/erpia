"use client"

import { Star, TrendingUp, Shield, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/motion"

const testimonials = [
  {
    quote:
      "Antes tardábamos 2 días en procesar pedidos web. Ahora con Clavis Ecommerce, el pedido se crea, reserva stock y genera el remito automáticamente. Reducimos tiempo en un 90%.",
    name: "Roberto F.",
    role: "Distribuidora de Herrajes · Córdoba",
    rating: 5,
  },
  {
    quote:
      "El portal B2B fue un cambio total para nuestra distribución. Nuestros clientes hacen los pedidos solos con sus listas de precios personalizadas. Ya no tenemos ese caos de WhatsApp.",
    name: "Patricia L.",
    role: "Distribuidora de Cosméticos · Buenos Aires",
    rating: 5,
  },
  {
    quote:
      "La integración con AFIP es nativa y perfecta. Antes teníamos que cargar facturas a mano. Ahora el CAE lo genera solo al despachar el pedido. Es increíble.",
    name: "Diego M.",
    role: "Importadora de Electrónicos · Rosario",
    rating: 5,
  },
]

const metrics = [
  { value: "94%", label: "Reducción de errores de stock", icon: Shield },
  { value: "3x", label: "Mayor velocidad de despacho", icon: Zap },
  { value: "2.1k+", label: "Tiendas activas en Argentina", icon: TrendingUp },
  { value: "99.8%", label: "Disponibilidad del servicio", icon: Star },
]

export function EcommerceSocialProof() {
  return (
    <section className="py-16 md:py-24 bg-white" id="testimonios">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-20">

        {/* Métricas */}
        <ScrollReveal>
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white">
            <div className="text-center mb-10">
              <Badge className="bg-white/10 text-white border-white/20 mb-3">Resultados comprobados</Badge>
              <h2 className="font-[var(--font-fraunces)] text-3xl font-bold">
                Lo que logran nuestros clientes
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {metrics.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 text-amber-300" />
                    </div>
                    <div className="font-[var(--font-fraunces)] text-4xl font-bold text-white">{stat.value}</div>
                    <div className="mt-1 text-sm text-slate-300">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Testimonios */}
        <ScrollReveal className="text-center">
          <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-800">
            <Star className="mr-1.5 h-3.5 w-3.5 inline fill-yellow-400 text-yellow-400" />
            Testimonios
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900">
            Más de 500 PyMEs ya vendieron más con Clavis
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 text-sm">
            Negocios argentinos que unificaron su operación y empezaron a crecer.
          </p>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 -mt-6">
          {testimonials.map((t) => (
            <ScrollReveal key={t.name}>
              <Card className="flex flex-col h-full border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm text-slate-600 leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  )
}
