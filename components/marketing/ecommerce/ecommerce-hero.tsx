"use client"

import Link from "next/link"
import { ArrowRight, ShoppingCart, Sparkles, Truck, Package, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MotionFadeDown, motion } from "@/components/ui/motion"
import { BRAND_NAME } from "@/lib/brand"

export function EcommerceHero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Orbs de fondo decorativos */}
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Texto y Acciones */}
          <MotionFadeDown className="space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-800 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Stock unificado · AFIP · Picking automático</span>
            </div>

            <h1 className="font-[var(--font-fraunces)] text-4xl font-semibold leading-[1.15] text-slate-900 sm:text-5xl md:text-6xl">
              Tu tienda online conectada al{" "}
              <span className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 bg-clip-text text-transparent">
                stock real
              </span>{" "}
              y la factura AFIP.
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Vendé de forma minorista (B2C) o mayorista (B2B) desde un solo panel en {BRAND_NAME}. 
              Sin reingresar pedidos a mano, sin vender sin stock y con facturación automatizada.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
                asChild
              >
                <Link href="/tienda?empresaId=1">
                  Probar tienda demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-slate-200 bg-white/50 text-slate-700 hover:bg-slate-50"
                asChild
              >
                <Link href="/portal?empresa=1">
                  Ver portal mayorista
                </Link>
              </Button>
            </div>
          </MotionFadeDown>

          {/* Visual Mockup CSS/SVG Premium */}
          <div className="relative">
            {/* Sombras y blur orbs detrás de la composición */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-amber-500/10 to-sky-500/10 blur-2xl" />
            
            <div className="relative mx-auto w-full max-w-[500px]">
              <Card className="border-white/70 bg-white/80 p-5 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)]">
                {/* Cabecera simulada de la Tienda */}
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-350" />
                    <div className="h-6 w-20 rounded bg-slate-100" />
                  </div>
                  <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50/50">
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    En línea
                  </Badge>
                </div>

                {/* Grid de productos simulados */}
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/60 bg-white/90 p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">Amortiguador Corven Delantero</div>
                        <div className="text-[11px] text-slate-500">SKU: AM-COR-001</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm">$48.500</div>
                        <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          12 en stock
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/60 bg-white/90 p-4 shadow-sm opacity-90">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">Aceite Sintético Castrol 4L</div>
                        <div className="text-[11px] text-slate-500">SKU: AC-CAS-5W40</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm">$64.200</div>
                        <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          8 en stock
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de estado de sincronización */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500 animate-spin" style={{ animationDuration: '6s' }} />
                    Sincronizado con Stock Local y AFIP
                  </span>
                  <span className="text-slate-450 font-bold">100% Ok</span>
                </div>
              </Card>

              {/* Elemento flotante 1: Carrito activo */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -left-6 bottom-8 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Nuevo Pedido</div>
                  <div className="text-xs font-bold text-slate-800">$112.700 total</div>
                </div>
              </motion.div>

              {/* Elemento flotante 2: Notificación Factura AFIP */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -right-6 -top-4 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Package className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Factura Electrónica</div>
                  <div className="text-xs font-bold text-slate-800">CAE Autorizado</div>
                </div>
              </motion.div>
            </div>
          </div>

        </div>

        {/* Fila de Confianza (Logos/Badges) */}
        <div className="mt-20 border-t border-slate-200/60 pt-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Conectividad Operativa Total
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-4">
            {[
              { label: "Integrado al ERP", icon: Package },
              { label: "Precios Automáticos", icon: Sparkles },
              { label: "Multi-canal Sincronizado", icon: RefreshCw },
              { label: "Hecho en Argentina", icon: Truck }
            ].map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/60 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm"
              >
                <badge.icon className="h-3.5 w-3.5 text-slate-500" />
                {badge.label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
