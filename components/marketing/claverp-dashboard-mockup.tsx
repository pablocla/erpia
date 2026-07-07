"use client"

import { Activity, Bell, FileText, Package, TrendingUp, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

interface ClaverpDashboardMockupProps {
  className?: string
  /** Variante compacta para secciones de features */
  compact?: boolean
}

function BrowserChrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_30%_20%,rgba(37,99,235,0.35),transparent_60%),radial-gradient(ellipse_at_75%_85%,rgba(16,185,129,0.25),transparent_55%)] blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/30 ring-1 ring-blue-400/20">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/90 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" aria-hidden />
          <div className="mx-3 flex flex-1 items-center justify-center rounded-full bg-white px-3 py-1 text-[10px] text-slate-500 ring-1 ring-slate-200/80">
            {url}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Mockup principal del panel — inspirado en patrones SaaS, contenido propio Claver */
export function ClaverpDashboardMockup({ className, compact }: ClaverpDashboardMockupProps) {
  return (
    <div className={cn("w-full", className)}>
      <BrowserChrome url="app.claver.com.ar/dashboard">
        <div className={cn("grid gap-0", compact ? "p-4" : "p-4 sm:p-5")}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Panel general
              </p>
              <p className="text-sm font-semibold text-slate-900">Distribuidora Demo S.A.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              En vivo
            </span>
          </div>

          <div className={cn("grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-3")}>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <TrendingUp className="h-3 w-3" aria-hidden />
                Ingresos · 7 días
              </div>
              <p className="mt-1 font-[var(--font-fraunces)] text-lg font-bold text-slate-900">
                {currency.format(1_248_200)}
              </p>
              <p className="text-[10px] font-semibold text-emerald-600">+12,4% vs semana anterior</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <FileText className="h-3 w-3" aria-hidden />
                Facturas hoy
              </div>
              <p className="mt-1 font-[var(--font-fraunces)] text-lg font-bold text-slate-900">47</p>
              <p className="text-[10px] text-slate-500">CAE OK · 0 rechazadas</p>
            </div>
            {!compact && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:col-span-1 col-span-2">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                  <Package className="h-3 w-3" aria-hidden />
                  Stock crítico
                </div>
                <p className="mt-1 font-[var(--font-fraunces)] text-lg font-bold text-amber-700">3 SKUs</p>
                <p className="text-[10px] text-slate-500">Reposición sugerida</p>
              </div>
            )}
          </div>

          <div className={cn("mt-3 grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Acciones pendientes
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  3 facturas por revisar
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                  2 clientes fiado en mora
                </li>
                <li className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                  Caja #1 — turno abierto
                </li>
              </ul>
            </div>
            {!compact && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                  Última venta
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Factura B · $ 84.350</p>
                <p className="text-xs text-slate-500">Cliente: Almacén Don Carlos</p>
                <p className="mt-1 text-[10px] font-mono text-emerald-700">CAE 74291845230178</p>
              </div>
            )}
          </div>
        </div>
      </BrowserChrome>
    </div>
  )
}

export type FeatureVisual = "invoicing" | "treasury" | "stock" | "crm" | "industry"

export function ClaverpFeatureVisual({ type }: { type: FeatureVisual }) {
  const panels: Record<FeatureVisual, React.ReactNode> = {
    invoicing: (
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Factura B · emitida
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{currency.format(128_450)}</p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
            CAE OK
          </span>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Distribuidora Demo S.A.</p>
          <p className="mt-1">CUIT 30-71234567-8 · Punto de venta 0001</p>
          <p className="mt-2 font-mono text-[10px] text-emerald-700">CAE 74291845230178 · Vto 05/07/2026</p>
        </div>
        <div className="flex gap-2">
          {["PDF", "Enviar", "Libro IVA"].map((a) => (
            <span
              key={a}
              className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    ),
    treasury: (
      <div className="space-y-3 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Tesorería · hoy
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-[10px] text-emerald-700">En caja</p>
            <p className="text-lg font-bold text-emerald-900">{currency.format(312_800)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-[10px] text-amber-700">Fiado pendiente</p>
            <p className="text-lg font-bold text-amber-900">{currency.format(89_200)}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {[72, 58, 45, 38].map((h, i) => (
            <div key={i} className="flex items-end gap-1">
              <div
                className="w-full rounded-sm bg-blue-500/80"
                style={{ height: `${h * 0.4}px` }}
                aria-hidden
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500">Flujo de cobros — últimos 7 días</p>
      </div>
    ),
    stock: (
      <div className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Depósito central
        </p>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="pb-2 font-medium">Producto</th>
              <th className="pb-2 font-medium text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="text-slate-800">
            {[
              ["Yerba 1kg", "142 u."],
              ["Aceite girasol", "8 u."],
              ["Arroz 5kg", "56 u."],
            ].map(([name, qty]) => (
              <tr key={name} className="border-t border-slate-100">
                <td className="py-2">{name}</td>
                <td className="py-2 text-right font-semibold">{qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] font-medium text-amber-800">
          Aceite girasol — bajo mínimo (15 u.)
        </p>
      </div>
    ),
    crm: (
      <div className="space-y-2 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Clientes activos
        </p>
        {[
          { name: "Don Carlos", saldo: 45_200, estado: "Al día" },
          { name: "María del Valle", saldo: 12_800, estado: "Mora 5d" },
          { name: "Ferretería Norte", saldo: 0, estado: "Contado" },
        ].map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{c.name}</p>
              <p className="text-[10px] text-slate-500">{c.estado}</p>
            </div>
            <p className="text-sm font-bold text-slate-800">{currency.format(c.saldo)}</p>
          </div>
        ))}
      </div>
    ),
    industry: (
      <div className="grid grid-cols-2 gap-2 p-5">
        {[
          { emoji: "🏪", label: "Almacén" },
          { emoji: "🏋️", label: "Gimnasio" },
          { emoji: "🥩", label: "Carnicería" },
          { emoji: "🐾", label: "Veterinaria" },
        ].map((d) => (
          <div
            key={d.label}
            className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-center transition hover:border-blue-300"
          >
            <span className="text-2xl" aria-hidden>
              {d.emoji}
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-800">{d.label}</p>
            <p className="text-[10px] text-blue-600">Demo lista</p>
          </div>
        ))}
      </div>
    ),
  }

  return (
    <BrowserChrome url="app.claver.com.ar">
      {panels[type]}
    </BrowserChrome>
  )
}