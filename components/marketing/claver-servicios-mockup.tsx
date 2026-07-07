"use client"

import { Calendar, MapPin, Navigation, MessageCircle } from "lucide-react"
import {
  MarketingAppShell,
  MockKpiGrid,
  MockActionButton,
  mockCurrency,
} from "@/components/marketing/marketing-app-shell"
import { MOCK_SERVICIOS } from "@/lib/marketing/product-mock-data"
import { cn } from "@/lib/utils"

const D = MOCK_SERVICIOS

const ESTADO_STYLE = {
  Confirmado: "bg-emerald-100 text-emerald-800",
  "En camino": "bg-blue-100 text-blue-800",
  Pendiente: "bg-amber-100 text-amber-800",
  Disponible: "bg-slate-200 text-slate-600",
} as const

export function ClaverServiciosMockup({ className }: { className?: string }) {
  return (
    <MarketingAppShell
      slug="servicios"
      mockSlug="servicios"
      url="app.claver.com.ar/dashboard/agenda"
      glow="emerald"
      className={className}
    >
      {({ activeTab, runAction, busyAction, completedActions }) => {
        if (activeTab.includes("presupuestos")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Pipeline abierto", value: mockCurrency.format(D.kpis.pipeline), tone: "emerald", hint: `${D.kpis.presupuestosAbiertos} presupuestos` },
                  { label: "Aceptados mes", value: "2", tone: "violet", hint: mockCurrency.format(515_000) },
                ]}
              />
              <ul className="space-y-2">
                {D.presupuestos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm shadow-sm">
                    <div>
                      <p className="font-semibold">{p.titulo}</p>
                      <p className="text-[10px] text-muted-foreground">{p.estado}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{mockCurrency.format(p.monto)}</p>
                      <MockActionButton
                        id={`pres-${p.id}`}
                        label="WA"
                        icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                        variant="ghost"
                        busy={busyAction === `pres-${p.id}`}
                        done={completedActions.has(`pres-${p.id}`)}
                        onClick={() => runAction(`pres-${p.id}`, `Seguimiento enviado — ${p.titulo}`)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        }

        if (activeTab.includes("cuentas-cobrar")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Morosos servicios", value: String(D.kpis.morosos), tone: "amber", hint: "WA automático" },
                  { label: "Recuperable", value: mockCurrency.format(100_500), tone: "blue" },
                ]}
              />
              <ul className="space-y-2">
                {D.morosos.map((m) => (
                  <li key={m.nombre} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{m.nombre}</p>
                      <p className="text-[10px] text-amber-700">{m.dias} días vencido</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{mockCurrency.format(m.saldo)}</p>
                      <MockActionButton
                        id={`mor-${m.nombre}`}
                        label="Cobrar"
                        icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                        busy={busyAction === `mor-${m.nombre}`}
                        done={completedActions.has(`mor-${m.nombre}`)}
                        onClick={() => runAction(`mor-${m.nombre}`, `Link de pago enviado a ${m.nombre}`)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        }

        return (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{D.empresa}</p>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                {D.kpis.turnosHoy} turnos hoy
              </span>
            </div>
            <MockKpiGrid
              items={[
                { label: "Presupuestos abiertos", value: String(D.kpis.presupuestosAbiertos), tone: "emerald", hint: `${mockCurrency.format(D.kpis.pipeline)} pipeline` },
                { label: "Morosos", value: String(D.kpis.morosos), tone: "amber", hint: "WA automático" },
              ]}
            />
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Agenda de hoy
            </p>
            <ul className="space-y-2">
              {D.turnos.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-slate-50 text-center ring-1 ring-slate-200">
                    <span className="text-[10px] font-bold text-slate-800">{t.hora}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.cliente}</p>
                    <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate">
                      <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                      {t.direccion}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ESTADO_STYLE[t.estado])}>
                      {t.estado}
                    </span>
                    {t.estado === "En camino" && (
                      <MockActionButton
                        id={`nav-${t.id}`}
                        label="Llegué"
                        icon={<Navigation className="h-3 w-3" aria-hidden />}
                        variant="ghost"
                        busy={busyAction === `nav-${t.id}`}
                        done={completedActions.has(`nav-${t.id}`)}
                        onClick={() => runAction(`nav-${t.id}`, "Cliente notificado — técnico en sitio")}
                      />
                    )}
                    {t.estado === "Pendiente" && (
                      <MockActionButton
                        id={`conf-${t.id}`}
                        label="Confirmar"
                        busy={busyAction === `conf-${t.id}`}
                        done={completedActions.has(`conf-${t.id}`)}
                        onClick={() => runAction(`conf-${t.id}`, "Turno confirmado por WhatsApp")}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )
      }}
    </MarketingAppShell>
  )
}