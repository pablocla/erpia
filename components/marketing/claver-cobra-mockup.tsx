"use client"

import { MessageCircle, Send } from "lucide-react"
import {
  MarketingAppShell,
  MockKpiGrid,
  MockActionButton,
  mockCurrency,
} from "@/components/marketing/marketing-app-shell"
import { MOCK_COBRA } from "@/lib/marketing/product-mock-data"
import { cn } from "@/lib/utils"

const D = MOCK_COBRA
const recuperable = D.morosos.reduce((s, m) => s + m.saldo, 0)

export function ClaverCobraMockup({ className }: { className?: string }) {
  return (
    <MarketingAppShell
      slug="cobra"
      mockSlug="cobra"
      url="app.claver.com.ar/dashboard/cuentas-cobrar"
      glow="blue"
      className={className}
    >
      {({ activeTab, runAction, busyAction, completedActions }) => {
        if (activeTab.includes("clientes")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Clientes morosos", value: String(D.morosos.length), tone: "amber" },
                  { label: "Con WhatsApp", value: String(D.morosos.length), tone: "emerald" },
                ]}
              />
              <ul className="space-y-2">
                {D.morosos.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="font-bold">{mockCurrency.format(m.saldo)}</p>
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
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                {D.morosos.length} morosos
              </span>
            </div>
            <MockKpiGrid
              items={[
                { label: "Recuperable", value: mockCurrency.format(recuperable), tone: "blue" },
                { label: "Cobrado esta semana", value: mockCurrency.format(D.cobradoSemana), tone: "emerald" },
              ]}
            />
            <ul className="space-y-2">
              {D.morosos.map((m) => {
                const enviado = m.enviado || completedActions.has(`cobra-${m.id}`) || completedActions.has("cobra-todos")
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                      enviado ? "border-emerald-100 bg-emerald-50/40" : "border-slate-100 bg-white shadow-sm",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {m.dias} días vencido · {mockCurrency.format(m.saldo)}
                      </p>
                    </div>
                    {enviado ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <MessageCircle className="h-3 w-3" aria-hidden />
                        Enviado
                      </span>
                    ) : (
                      <MockActionButton
                        id={`cobra-${m.id}`}
                        label="Enviar"
                        icon={<Send className="h-3 w-3" aria-hidden />}
                        variant="primary"
                        busy={busyAction === `cobra-${m.id}`}
                        done={false}
                        onClick={() => runAction(`cobra-${m.id}`, `Recordatorio WA enviado a ${m.name}`)}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex justify-end">
              <MockActionButton
                id="cobra-todos"
                label="Enviar a todos"
                variant="primary"
                busy={busyAction === "cobra-todos"}
                done={completedActions.has("cobra-todos")}
                onClick={() => runAction("cobra-todos", "3 recordatorios programados por WhatsApp")}
              />
            </div>
          </>
        )
      }}
    </MarketingAppShell>
  )
}