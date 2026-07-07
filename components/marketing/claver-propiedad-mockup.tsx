"use client"

import { Building2, Globe, Key, MessageCircle } from "lucide-react"
import {
  MarketingAppShell,
  MockKpiGrid,
  MockActionButton,
  mockCurrency,
} from "@/components/marketing/marketing-app-shell"
import { MOCK_PROPIEDAD } from "@/lib/marketing/product-mock-data"
import { cn } from "@/lib/utils"

const D = MOCK_PROPIEDAD

export function ClaverPropiedadMockup({ className }: { className?: string }) {
  return (
    <MarketingAppShell
      slug="propiedad"
      mockSlug="propiedad"
      url="app.claver.com.ar/dashboard/nicho/consorcios"
      glow="blue"
      className={className}
    >
      {({ activeTab, runAction, busyAction, completedActions }) => {
        if (activeTab.includes("garantia")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Contratos activos", value: "2", tone: "blue" },
                  { label: "Disponibles", value: "1", tone: "emerald" },
                ]}
              />
              <ul className="space-y-2">
                {D.contratos.map((c) => (
                  <li key={c.uf} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{c.uf}</p>
                      <p className="text-[10px] text-muted-foreground">{c.inquilino}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium">{c.vence}</p>
                      <p className="text-[10px] text-muted-foreground">{c.garantia}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        }

        if (activeTab.includes("cuentas-cobrar")) {
          const morosos = D.unidades.filter((u) => u.estado.includes("Mora"))
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Morosos UF", value: String(morosos.length), tone: "amber" },
                  { label: "Recuperable", value: mockCurrency.format(morosos.reduce((s, u) => s + u.expensa, 0)), tone: "blue" },
                ]}
              />
              <ul className="space-y-2">
                {morosos.map((u) => (
                  <li key={u.uf} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{u.uf} — {u.inquilino}</p>
                      <p className="text-[10px] text-amber-700">{u.estado}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{mockCurrency.format(u.expensa)}</p>
                      <MockActionButton
                        id={`cob-${u.uf}`}
                        label="Cobrar"
                        icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                        busy={busyAction === `cob-${u.uf}`}
                        done={completedActions.has(`cob-${u.uf}`)}
                        onClick={() => runAction(`cob-${u.uf}`, `Link de pago enviado — ${u.inquilino}`)}
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
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-700" aria-hidden />
                {D.edificio}
              </p>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-800">{D.periodo}</span>
            </div>
            <MockKpiGrid
              items={[
                { label: "Liquidación mes", value: mockCurrency.format(D.kpis.liquidacionMes), tone: "blue", hint: `${D.kpis.unidades} unidades` },
                { label: "Morosos expensas", value: String(D.kpis.morosos), tone: "amber", hint: "Aviso WA en 1 toque" },
              ]}
            />
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Unidades / expensas</p>
            <ul className="mb-3 space-y-2">
              {D.unidades.map((u) => {
                const cobrado = completedActions.has(`exp-${u.uf}`) || u.waEnviado
                return (
                  <li
                    key={u.uf}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                      cobrado && u.estado.includes("Mora") ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-white shadow-sm",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{u.uf} — {u.inquilino}</p>
                      <p className={cn("text-[10px] font-medium", u.estado.includes("Mora") ? "text-amber-700" : "text-emerald-600")}>
                        {cobrado && u.estado.includes("Mora") ? "Aviso enviado" : u.estado}
                      </p>
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      <p className="text-sm font-bold">{mockCurrency.format(u.expensa)}</p>
                      {u.estado.includes("Mora") && !cobrado && (
                        <MockActionButton
                          id={`exp-${u.uf}`}
                          label="Cobrar"
                          icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                          variant="ghost"
                          busy={busyAction === `exp-${u.uf}`}
                          done={false}
                          onClick={() => runAction(`exp-${u.uf}`, `Recordatorio expensas enviado — ${u.inquilino}`)}
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <Globe className="h-3.5 w-3.5" aria-hidden />
                Portales conectados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {D.portales.map((portal) => (
                  <span
                    key={portal}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                  >
                    <Key className="h-2.5 w-2.5" aria-hidden />
                    {portal}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <MockActionButton
                id="liq-exp"
                label="Liquidar expensas"
                variant="primary"
                busy={busyAction === "liq-exp"}
                done={completedActions.has("liq-exp")}
                onClick={() => runAction("liq-exp", `Liquidación ${D.periodo} generada — ${mockCurrency.format(D.kpis.liquidacionMes)}`)}
              />
            </div>
          </>
        )
      }}
    </MarketingAppShell>
  )
}