"use client"

import { MessageCircle, Plus, Users } from "lucide-react"
import {
  MarketingAppShell,
  MockKpiGrid,
  MockActionButton,
  mockCurrency,
} from "@/components/marketing/marketing-app-shell"
import { MOCK_FIADO } from "@/lib/marketing/product-mock-data"
import { cn } from "@/lib/utils"

const D = MOCK_FIADO
const totalDeuda = D.deudores.reduce((s, d) => s + d.saldo, 0)

export function ClaverFiadoMockup({ className }: { className?: string }) {
  return (
    <MarketingAppShell
      slug="fiado"
      mockSlug="fiado"
      url="app.claver.com.ar/dashboard/fiado"
      glow="emerald"
      className={className}
    >
      {({ activeTab, runAction, busyAction, completedActions }) => {
        if (activeTab.includes("clientes")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Clientes fiado", value: String(D.deudores.length), tone: "emerald" },
                  { label: "Sobre límite", value: "1", tone: "amber" },
                ]}
              />
              <ul className="space-y-2">
                {D.deudores.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">Límite {mockCurrency.format(d.limite)}</p>
                    </div>
                    <p className="text-sm font-bold">{mockCurrency.format(d.saldo)}</p>
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
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white active:scale-95 transition-transform"
                onClick={() => runAction("anotar", "Fiado anotado — $3.200 a Don Carlos")}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Anotar fiado
              </button>
            </div>
            <MockKpiGrid
              items={[
                { label: "Total fiado", value: mockCurrency.format(totalDeuda), tone: "amber", hint: `${D.deudores.length} clientes con saldo` },
                { label: "Cobrado hoy", value: mockCurrency.format(D.cobradoHoy), tone: "emerald", hint: "2 pagos registrados" },
              ]}
            />
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Users className="h-3.5 w-3.5" aria-hidden />
              Libreta de fiado
            </p>
            <ul className="space-y-2">
              {D.deudores.map((d) => (
                <li
                  key={d.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                    completedActions.has(`fiado-${d.id}`) ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-white shadow-sm",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.name}</p>
                    <p className={cn("text-[10px] font-medium", d.estado === "Sobre límite" ? "text-red-600" : "text-slate-500")}>
                      {d.estado} · límite {mockCurrency.format(d.limite)}
                    </p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <p className="text-sm font-bold">{mockCurrency.format(d.saldo)}</p>
                    <MockActionButton
                      id={`fiado-${d.id}`}
                      label="Avisar"
                      icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                      variant="ghost"
                      busy={busyAction === `fiado-${d.id}`}
                      done={completedActions.has(`fiado-${d.id}`)}
                      onClick={() => runAction(`fiado-${d.id}`, `Recordatorio enviado a ${d.name}`)}
                    />
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