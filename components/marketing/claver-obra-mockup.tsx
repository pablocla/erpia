"use client"

import { Hammer, MessageCircle, Wallet, CheckCircle2 } from "lucide-react"
import {
  MarketingAppShell,
  MockKpiGrid,
  MockActionButton,
  mockCurrency,
} from "@/components/marketing/marketing-app-shell"
import { MOCK_OBRA } from "@/lib/marketing/product-mock-data"
import { cn } from "@/lib/utils"

const D = MOCK_OBRA

export function ClaverObraMockup({ className }: { className?: string }) {
  return (
    <MarketingAppShell
      slug="obra"
      mockSlug="obra"
      url="app.claver.com.ar/dashboard/nicho/obras"
      glow="amber"
      className={className}
    >
      {({ activeTab, runAction, busyAction, completedActions }) => {
        if (activeTab.includes("cuentas-cobrar")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Cliente debe hito", value: mockCurrency.format(D.kpis.hitoPendiente), tone: "blue", hint: "Hormigonado losa" },
                  { label: "Cobrado obra", value: mockCurrency.format(890_000), tone: "emerald", hint: "Acumulado" },
                ]}
              />
              <ul className="space-y-2">
                {D.hitos.map((h) => (
                  <li key={h.nombre} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{h.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">Vence {h.vence}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{mockCurrency.format(h.monto)}</p>
                      <MockActionButton
                        id={`hito-${h.nombre}`}
                        label={h.avisado ? "Reenviar" : "Avisar"}
                        icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                        variant={h.avisado ? "ghost" : "primary"}
                        busy={busyAction === `hito-${h.nombre}`}
                        done={completedActions.has(`hito-${h.nombre}`)}
                        onClick={() => runAction(`hito-${h.nombre}`, `Aviso de hito enviado — ${h.nombre}`)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        }

        if (activeTab.includes("clientes")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Obreros activos", value: String(D.kpis.obreros), tone: "amber" },
                  { label: "Jornales semana", value: String(D.kpis.jornalesSemana), tone: "emerald" },
                ]}
              />
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Equipo en obra</p>
              <ul className="space-y-2">
                {D.obreros.map((o) => (
                  <li key={o.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                    <div>
                      <p className="font-semibold">{o.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">Oficio: Albañil</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-700">{o.jornales} jornales</p>
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
                <Hammer className="h-3.5 w-3.5 text-amber-700" aria-hidden />
                {D.obra}
              </p>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-900">
                Semana {D.semana}
              </span>
            </div>
            <MockKpiGrid
              items={[
                { label: "Liquidación viernes", value: mockCurrency.format(D.kpis.liquidacionViernes), tone: "amber", hint: `${D.kpis.obreros} obreros` },
                { label: "Cliente debe hito", value: mockCurrency.format(D.kpis.hitoPendiente), tone: "blue", hint: "Hormigonado" },
              ]}
            />
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Liquidación semanal</p>
            <ul className="space-y-2">
              {D.obreros.map((o) => {
                const liquidado = completedActions.has(`liq-${o.id}`) || completedActions.has("liq-todos")
                return (
                  <li
                    key={o.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      liquidado ? "border-emerald-200 bg-emerald-50/60" : "border-slate-100 bg-white shadow-sm",
                    )}
                  >
                    <div>
                      <p className="font-semibold">{o.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {o.jornales} jornales · adelanto {mockCurrency.format(o.adelanto)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-bold flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                        {mockCurrency.format(o.neto)}
                      </p>
                      {liquidado ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          Liquidado
                        </span>
                      ) : (
                        <MockActionButton
                          id={`liq-${o.id}`}
                          label="Liquidar"
                          busy={busyAction === `liq-${o.id}`}
                          done={false}
                          onClick={() => runAction(`liq-${o.id}`, `${o.nombre} liquidado — ${mockCurrency.format(o.neto)}`)}
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex justify-end">
              <MockActionButton
                id="liq-todos"
                label="Liquidar todos"
                variant="primary"
                busy={busyAction === "liq-todos"}
                done={completedActions.has("liq-todos")}
                onClick={() =>
                  runAction(
                    "liq-todos",
                    `Liquidación semana ${D.semana} confirmada — ${mockCurrency.format(D.kpis.liquidacionViernes)}`,
                    1200,
                  )
                }
              />
            </div>
          </>
        )
      }}
    </MarketingAppShell>
  )
}