"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, CreditCard, MessageSquare, Cpu, Store, ShoppingCart, Users, RefreshCw, ClipboardList, FileText, ArrowRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/motion"

export function EcommercePricing() {
  const currency = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  })

  // --- PLANES BASE ---
  const basePlans = [
    {
      id: "canal-online",
      name: "Canal Online",
      price: 24900,
      description: "Ideal para comercios minoristas locales que quieren empezar a vender en la web.",
      features: [
        "Tienda Online B2C pública",
        "Hasta 500 SKUs activos",
        "1 Depósito sincronizado",
        "Precios unificados con POS",
        "Soporte básico por email"
      ],
      cta: "Empezar trial gratis",
      highlighted: false
    },
    {
      id: "multicanal-pro",
      name: "Multi-canal Pro",
      price: 39900,
      description: "La solución completa para comercios en crecimiento que venden minorista y mayorista.",
      features: [
        "Tienda Online B2C pública",
        "Portal Mayorista B2B (CUIT)",
        "Hasta 2.500 SKUs activos",
        "2 Depósitos sincronizados",
        "Integración básica Mercado Pago",
        "Soporte prioritario 24/7"
      ],
      cta: "Empezar trial gratis",
      highlighted: true
    },
    {
      id: "distribuidora",
      name: "Distribuidora",
      price: 59900,
      description: "Para grandes operaciones, fabricantes y redes de distribución complejas.",
      features: [
        "Todo lo de Multi-canal Pro",
        "SKUs ilimitados",
        "3 Depósitos o más",
        "Logística de despachos integrada",
        "Picking y Hojas de Ruta",
        "Integración avanzada Mercado Libre",
        "Account Manager dedicado"
      ],
      cta: "Hablar con ventas",
      highlighted: false
    }
  ]

  // --- ADD-ONS ---
  const addons = [
    {
      name: "Mercado Pago",
      price: 9900,
      desc: "Cobros directos con QR, tarjetas y link de pago en el checkout.",
      icon: CreditCard
    },
    {
      name: "Mercado Libre",
      price: 14900,
      desc: "Sincronizá tus publicaciones de Mercado Libre y bajá los pedidos al ERP.",
      icon: Store
    },
    {
      name: "WhatsApp Business",
      price: 7900,
      desc: "Envió automático de notificaciones de pedido, confirmación y tracking.",
      icon: MessageSquare
    },
    {
      name: "Automation Hub",
      price: 29900,
      desc: "Alertas inteligentes de stock bajo, reposiciones y re-pedidos automáticos.",
      icon: Cpu
    }
  ]

  // --- INTERACTIVE MICROSERVICES BUILDER STATE ---
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({
    "cart-b2c": true,
    "portal-b2b": false,
    "stock-res": true,
    "picking-dep": false,
    "afip-auto": true,
    "wa-tracking": false,
  })

  const microServices = [
    {
      id: "cart-b2c",
      name: "Tienda B2C Minorista",
      price: 14900,
      category: "Canal",
      desc: "Venta directa al público sin registro.",
      icon: ShoppingCart,
    },
    {
      id: "portal-b2b",
      name: "Portal B2B Mayorista",
      price: 19900,
      category: "Canal",
      desc: "Ingreso por CUIT con listas de precios del cliente.",
      icon: Users,
    },
    {
      id: "stock-res",
      name: "Reserva de Stock Inmediata",
      price: 7900,
      category: "Operación",
      desc: "Evita ventas duplicadas reservando en el acto.",
      icon: RefreshCw,
    },
    {
      id: "picking-dep",
      name: "Fila de Picking Digital",
      price: 12900,
      category: "Operación",
      desc: "Pantalla táctil para preparación de pedidos en depósito.",
      icon: ClipboardList,
    },
    {
      id: "afip-auto",
      name: "Facturación AFIP Automática",
      price: 14900,
      category: "Administración",
      desc: "Emisión de factura y obtención de CAE al remitar.",
      icon: FileText,
    },
    {
      id: "wa-tracking",
      name: "WhatsApp Delivery Tracking",
      price: 7900,
      category: "Notificaciones",
      desc: "Avisos automáticos de estado al celular del cliente.",
      icon: MessageSquare,
    },
  ]

  const toggleService = (id: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const customTotal = Object.entries(selectedServices).reduce((acc, [id, active]) => {
    if (!active) return acc
    const service = microServices.find(s => s.id === id)
    return acc + (service?.price ?? 0)
  }, 0)

  return (
    <section className="py-16 md:py-24 bg-white space-y-24">
      
      {/* SECCIÓN INTERACTIVA: CONFIGURADOR DE MICROSERVICIOS */}
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 md:p-10 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.3)]">
          
          <div className="text-center space-y-3 mb-10">
            <Badge className="bg-amber-600 text-white hover:bg-amber-600">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 inline animate-pulse" />
              Exclusivo: Cotizador a Medida
            </Badge>
            <h3 className="font-[var(--font-fraunces)] text-2xl font-bold text-slate-900 md:text-3xl">
              Diseñá tu propio flujo de procesos
            </h3>
            <p className="text-sm text-slate-650 max-w-xl mx-auto">
              ¿No querés un plan prearmado? Seleccioná las piezas operativas que tu empresa necesita y pagá solo por lo que usás.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Toggles de Microservicios */}
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Microservicios Operacionales</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {microServices.map((service) => {
                  const active = selectedServices[service.id]
                  const Icon = service.icon
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 select-none ${
                        active
                          ? "border-amber-500 bg-amber-500/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-350"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                          active ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-950">{service.name}</h4>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{service.category}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500 leading-relaxed min-h-[32px]">
                        {service.desc}
                      </p>
                      <div className="mt-3 border-t border-slate-100 pt-2 flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span>Costo mensual</span>
                        <span className={active ? "text-amber-700 font-bold" : "text-slate-600"}>
                          {currency.format(service.price)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Simulación en Vivo y Checkout */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Simulación del Pipeline Activo</h4>
                  <p className="text-[11px] text-slate-500">Los pedidos fluirán por los siguientes nodos activados:</p>
                </div>

                {/* Pipeline visual animado */}
                <div className="space-y-3">
                  {[
                    { id: "cart-b2c", label: "Cliente Compra (B2C)", active: selectedServices["cart-b2c"], icon: ShoppingCart },
                    { id: "portal-b2b", label: "Cliente Compra (B2B CUIT)", active: selectedServices["portal-b2b"], icon: Users },
                    { id: "stock-res", label: "Reserva de Stock", active: selectedServices["stock-res"], icon: RefreshCw },
                    { id: "picking-dep", label: "Picking en Depósito", active: selectedServices["picking-dep"], icon: ClipboardList },
                    { id: "afip-auto", label: "Factura Electrónica AFIP", active: selectedServices["afip-auto"], icon: FileText },
                    { id: "wa-tracking", label: "Notificación de Despacho (WA)", active: selectedServices["wa-tracking"], icon: MessageSquare }
                  ].map((node) => {
                    const NodeIcon = node.icon
                    return (
                      <div
                        key={node.id}
                        className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 text-xs ${
                          node.active
                            ? "border-amber-300 bg-amber-500/5 text-slate-900 font-medium"
                            : "border-slate-100 bg-slate-50/50 text-slate-400 opacity-40"
                        }`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          node.active ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-400"
                        }`}>
                          <NodeIcon className="h-4 w-4" />
                        </div>
                        <span>{node.label}</span>
                        {node.active && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Totalizador de Cotización */}
              <div className="mt-8 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs text-slate-500 block">Suscripción estimada</span>
                    <span className="text-[10px] text-slate-400 font-semibold">* Precios ARS + IVA</span>
                  </div>
                  <div className="text-right">
                    <span className="font-[var(--font-fraunces)] text-3xl font-bold text-slate-950">
                      {currency.format(customTotal)}
                    </span>
                    <span className="text-slate-500 text-xs">/mes</span>
                  </div>
                </div>

                <Button className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800" asChild>
                  <Link href="/login">
                    Probar este flujo operativo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

            </div>

          </div>

        </div>
      </ScrollReveal>

      {/* PLANES FIJOS ESTÁNDAR */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Encabezado */}
        <ScrollReveal className="text-center">
          <Badge variant="outline" className="border-slate-350 bg-slate-100 text-slate-800">
            Planes Estándar
          </Badge>
          <h2 className="mt-4 font-[var(--font-fraunces)] text-3xl font-semibold text-slate-900 sm:text-4xl">
            Inversión simple con retorno inmediato
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-650">
            ¿Preferís una solución preconfigurada? Elegí el plan comercial que mejor se adapte a tu escala.
          </p>
        </ScrollReveal>

        {/* Planes Base */}
        <div className="mt-14 grid gap-8 lg:grid-cols-3 items-stretch">
          {basePlans.map((plan) => (
            <ScrollReveal key={plan.id} className="flex">
              <Card
                className={`relative flex flex-col w-full overflow-hidden border-white/70 bg-white/80 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-amber-300 shadow-[0_30px_70px_-40px_rgba(217,119,6,0.3)] ring-2 ring-amber-500/30"
                    : "shadow-[0_20px_50px_-45px_rgba(15,23,42,0.25)] hover:shadow-md"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />
                )}
                
                <CardHeader className="p-6">
                  {plan.highlighted && (
                    <Badge className="mb-2 w-fit bg-amber-600 text-white font-medium hover:bg-amber-600">Más elegido</Badge>
                  )}
                  <CardTitle className="font-[var(--font-fraunces)] text-2xl text-slate-900">{plan.name}</CardTitle>
                  
                  <div className="mt-3 flex items-baseline">
                    <span className="font-[var(--font-fraunces)] text-4xl font-bold text-slate-900">
                      {currency.format(plan.price)}
                    </span>
                    <span className="ml-1 text-sm text-slate-500">/mes</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 p-6 pt-0 justify-between">
                  <div className="border-t border-slate-100 pt-5 mb-6">
                    <ul className="space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={`w-full h-11 ${
                      plan.highlighted
                        ? "bg-slate-950 text-white hover:bg-slate-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
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

        {/* Add-ons Opcionales */}
        <ScrollReveal className="mt-20 border-t border-slate-100 pt-16">
          <div className="text-center">
            <h3 className="font-[var(--font-fraunces)] text-xl font-bold text-slate-900">
              Automatizá más canales con nuestros Add-ons
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Precios mensuales orientativos en ARS + IVA. Se activan a pedido.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {addons.map((addon) => {
              const Icon = addon.icon
              return (
                <Card key={addon.name} className="border-white/80 bg-white/60 shadow-sm">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-150 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{addon.name}</h4>
                        <div className="text-xs font-semibold text-amber-700 mt-0.5">
                          desde {currency.format(addon.price)}/mes
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-xs text-slate-500 leading-relaxed">{addon.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            * Los precios no incluyen impuestos y se facturan en pesos argentinos. Plan base del ERP no incluido.
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
