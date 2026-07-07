"use client"

import { Calendar, Clock, MessageCircle, Link2 } from "lucide-react"
import {
  MarketingAppShell,
  MockKpiGrid,
  MockActionButton,
} from "@/components/marketing/marketing-app-shell"
import { MOCK_TURNOS } from "@/lib/marketing/product-mock-data"
import { cn } from "@/lib/utils"

const D = MOCK_TURNOS

const ESTADO_STYLE = {
  Confirmado: "bg-emerald-100 text-emerald-800",
  Disponible: "bg-slate-200 text-slate-600",
  Recordatorio: "bg-amber-100 text-amber-800",
} as const

export function ClaverTurnosMockup({ className }: { className?: string }) {
  return (
    <MarketingAppShell
      slug="turnos"
      mockSlug="turnos"
      url="app.claver.com.ar/dashboard/agenda"
      glow="violet"
      className={className}
    >
      {({ activeTab, runAction, busyAction, completedActions, showToast }) => {
        if (activeTab.includes("clientes")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Clientes mes", value: "48", tone: "violet" },
                  { label: "Reagendados", value: "3", tone: "amber" },
                ]}
              />
              <p className="text-xs text-muted-foreground">Base de clientes del salón con historial de turnos.</p>
            </>
          )
        }

        return (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{D.salon} · Hoy</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                <Calendar className="h-3 w-3" aria-hidden />
                {D.turnos.length} turnos
              </span>
            </div>
            <div
              className="mb-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3 cursor-pointer hover:bg-violet-50 transition-colors active:scale-[0.99]"
              onClick={() => showToast("Link copiado al portapapeles", "info")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && showToast("Link copiado al portapapeles", "info")}
            >
              <p className="text-[10px] font-medium text-violet-800 flex items-center gap-1">
                <Link2 className="h-3 w-3" aria-hidden />
                Link público
              </p>
              <p className="mt-1 truncate font-mono text-xs text-violet-950">{D.linkPublico}</p>
            </div>
            <MockKpiGrid
              items={[
                { label: "Confirmados", value: "2", tone: "emerald" },
                { label: "Pendiente recordatorio", value: "1", tone: "amber" },
              ]}
            />
            <ul className="space-y-2">
              {D.turnos.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm"
                >
                  <div className="flex h-9 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-slate-50 text-center ring-1 ring-slate-200">
                    <Clock className="h-3 w-3 text-slate-400" aria-hidden />
                    <span className="text-[10px] font-bold text-slate-800">{t.hora}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.cliente}</p>
                    <p className="text-[10px] text-slate-500">{t.servicio}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ESTADO_STYLE[t.estado])}>
                      {t.estado}
                    </span>
                    {t.estado === "Recordatorio" && (
                      <MockActionButton
                        id={`turno-${t.id}`}
                        label="WA"
                        icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                        variant="ghost"
                        busy={busyAction === `turno-${t.id}`}
                        done={completedActions.has(`turno-${t.id}`)}
                        onClick={() => runAction(`turno-${t.id}`, `Recordatorio enviado a ${t.cliente}`)}
                      />
                    )}
                    {t.estado === "Disponible" && (
                      <MockActionButton
                        id={`book-${t.id}`}
                        label="Reservar"
                        busy={busyAction === `book-${t.id}`}
                        done={completedActions.has(`book-${t.id}`)}
                        onClick={() => runAction(`book-${t.id}`, "Hueco reservado — turno confirmado")}
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