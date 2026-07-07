"use client"

import { FileText, MessageCircle, Receipt, Send } from "lucide-react"
import {
  MarketingAppShell,
  MockKpiGrid,
  MockActionButton,
  mockCurrency,
} from "@/components/marketing/marketing-app-shell"
import { MOCK_MONOTRIBUTO } from "@/lib/marketing/product-mock-data"
import { cn } from "@/lib/utils"

const D = MOCK_MONOTRIBUTO

export function ClaverMonotributoMockup({ className }: { className?: string }) {
  return (
    <MarketingAppShell
      slug="monotributo"
      mockSlug="monotributo"
      url="app.claver.com.ar/dashboard/ventas/presupuestos"
      glow="violet"
      className={className}
    >
      {({ activeTab, runAction, busyAction, completedActions }) => {
        if (activeTab.includes("cuentas-cobrar")) {
          return (
            <>
              <MockKpiGrid
                items={[
                  { label: "Por cobrar", value: mockCurrency.format(D.kpis.pendienteCobro), tone: "amber", hint: "1 cuenta en mora" },
                  { label: "Cobrado julio", value: mockCurrency.format(127_500), tone: "emerald", hint: "3 pagos" },
                ]}
              />
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cuentas pendientes</p>
              <ul className="space-y-2">
                {D.cobros.map((c) => (
                  <li key={c.cliente} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{c.cliente}</p>
                      <p className={cn("text-[10px]", c.mora > 0 ? "text-amber-700" : "text-slate-500")}>
                        Vence {c.vence}{c.mora > 0 ? ` · ${c.mora}d mora` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{mockCurrency.format(c.monto)}</p>
                      <MockActionButton
                        id={`wa-${c.cliente}`}
                        label="WA"
                        icon={<MessageCircle className="h-3 w-3" aria-hidden />}
                        variant="ghost"
                        busy={busyAction === `wa-${c.cliente}`}
                        done={completedActions.has(`wa-${c.cliente}`)}
                        onClick={() => runAction(`wa-${c.cliente}`, `Recordatorio WA enviado a ${c.cliente}`)}
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
                  { label: "Clientes activos", value: String(D.clientes.length), tone: "violet" },
                  { label: "Con saldo", value: String(D.clientes.filter((c) => c.saldo > 0).length), tone: "amber" },
                ]}
              />
              <ul className="space-y-2">
                {D.clientes.map((c) => (
                  <li key={c.cuit} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{c.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">CUIT {c.cuit}</p>
                    </div>
                    <p className={cn("text-sm font-bold", c.saldo > 0 ? "text-amber-700" : "text-emerald-600")}>
                      {c.saldo > 0 ? mockCurrency.format(c.saldo) : "Al día"}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )
        }

        return (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-700">{D.empresa}</p>
                <p className="text-xs text-muted-foreground">CUIT {D.cuit}</p>
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-800">{D.categoria}</span>
            </div>
            <MockKpiGrid
              items={[
                { label: "Presupuesto aceptado", value: mockCurrency.format(D.kpis.presupuestoAceptado), tone: "violet", hint: "PRES-00042" },
                { label: "Pendiente de cobro", value: mockCurrency.format(D.kpis.pendienteCobro), tone: "amber", hint: "50% seña · 7d mora" },
              ]}
            />
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Presupuestos
            </p>
            <ul className="space-y-2">
              {D.presupuestos.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{p.titulo}</p>
                    <p className="text-[10px] text-muted-foreground">{p.horas}h · {p.id.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{mockCurrency.format(p.monto)}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className={cn(
                        "text-[10px] font-medium",
                        p.estado === "Aceptado" ? "text-emerald-700" : p.estado === "Enviado" ? "text-blue-700" : "text-slate-500",
                      )}>
                        {p.estado}
                      </span>
                      {p.estado === "Aceptado" && (
                        <MockActionButton
                          id={`fc-${p.id}`}
                          label="FC"
                          icon={<Receipt className="h-3 w-3" aria-hidden />}
                          busy={busyAction === `fc-${p.id}`}
                          done={completedActions.has(`fc-${p.id}`)}
                          onClick={() => runAction(`fc-${p.id}`, "Factura C 0001-00000124 emitida · AFIP OK")}
                        />
                      )}
                      {p.estado === "Enviado" && (
                        <MockActionButton
                          id={`send-${p.id}`}
                          label="Enviar"
                          icon={<Send className="h-3 w-3" aria-hidden />}
                          variant="ghost"
                          busy={busyAction === `send-${p.id}`}
                          done={completedActions.has(`send-${p.id}`)}
                          onClick={() => runAction(`send-${p.id}`, "Presupuesto reenviado por WhatsApp")}
                        />
                      )}
                    </div>
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