"use client"

import { useMemo, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { DollarSign, Percent, Users } from "lucide-react"
import { AFILIADO_RATES } from "@/lib/partners/affiliate-config"

type RoleMode = "seller" | "implementer"

export function CommissionCalculator() {
  const [clients, setClients] = useState(10)
  const [avgTicket, setAvgTicket] = useState(40000)
  const [role, setRole] = useState<RoleMode>("seller")

  const commissionPct = useMemo(
    () =>
      role === "implementer"
        ? Math.round(AFILIADO_RATES.implementerNivel1 * 100)
        : Math.round(AFILIADO_RATES.sellerNivel1 * 100),
    [role],
  )

  const mrr = clients * avgTicket
  const myCommission = (mrr * commissionPct) / 100
  const n2Pct = Math.round(AFILIADO_RATES.sellerNivel2 * 100)

  return (
    <div className="mx-auto my-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="mb-2 text-center text-xl font-bold text-slate-900 sm:text-2xl">
        Simulador de comisión (MRR)
      </h3>
      <p className="mb-6 text-center text-xs text-slate-500">
        Solo si los clientes <strong>pagan</strong> el abono. No es ingreso garantizado por reclutar
        gente.
      </p>

      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setRole("seller")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            role === "seller" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Seller {Math.round(AFILIADO_RATES.sellerNivel1 * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setRole("implementer")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            role === "implementer" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Implementer {Math.round(AFILIADO_RATES.implementerNivel1 * 100)}%
        </button>
      </div>

      <div className="space-y-8">
        <div>
          <div className="mb-2 flex justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users className="h-4 w-4" /> Clientes que pagan al día
            </label>
            <span className="font-bold text-blue-600">{clients}</span>
          </div>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[clients]}
            onValueChange={(val) => setClients(val[0])}
          />
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <DollarSign className="h-4 w-4" /> Ticket promedio / mes (ARS)
            </label>
            <span className="font-bold text-blue-600">${avgTicket.toLocaleString("es-AR")}</span>
          </div>
          <Slider
            min={10000}
            max={200000}
            step={5000}
            value={[avgTicket]}
            onValueChange={(val) => setAvgTicket(val[0])}
          />
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Percent className="h-4 w-4" /> Tu % Nivel 1
            </label>
            <span className="font-bold text-blue-600">{commissionPct}%</span>
          </div>
          <p className="text-xs text-slate-500">
            N2 (quien te invitó como partner) recibiría {n2Pct}% extra del mismo abono — no lo
            pagás vos; lo paga el pool del producto.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-xl border border-slate-100 bg-slate-50 p-6 md:flex-row">
        <div>
          <p className="text-sm text-slate-500">MRR de tus clientes (pagado)</p>
          <p className="text-2xl font-bold text-slate-900">${mrr.toLocaleString("es-AR")}</p>
        </div>
        <div className="text-center md:text-right">
          <p className="text-sm font-bold text-blue-600">Tu comisión estimada N1</p>
          <p className="text-4xl font-extrabold text-blue-600">
            ${myCommission.toLocaleString("es-AR")}{" "}
            <span className="text-sm font-medium text-slate-500">/ mes</span>
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Simulación educativa. No es promesa legal de ingresos. Comisión sujeta a pago real del
        cliente y reglas del Programa Partner Claver.
      </p>
    </div>
  )
}
