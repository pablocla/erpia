"use client"

import { useMemo, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { CalendarRange, DollarSign, Percent, Users } from "lucide-react"
import { AFILIADO_RATES } from "@/lib/partners/affiliate-config"
import {
  EXTRA_PRECIO_ILUSTRATIVO_ARS,
  simularComisionPartner,
} from "@/lib/partners/commission-simulator"

type RoleMode = "seller" | "implementer"

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export function CommissionCalculator() {
  const [referidos, setReferidos] = useState(50)
  const [upsellPct, setUpsellPct] = useState(10)
  const [extraArs, setExtraArs] = useState(EXTRA_PRECIO_ILUSTRATIVO_ARS)
  const [retencionPct, setRetencionPct] = useState(40)
  const [role, setRole] = useState<RoleMode>("seller")

  const n1 = useMemo(
    () => (role === "implementer" ? AFILIADO_RATES.implementerNivel1 : AFILIADO_RATES.sellerNivel1),
    [role],
  )

  const sim = useMemo(
    () =>
      simularComisionPartner({
        referidos,
        upsellPct,
        extraArs,
        n1Rate: n1,
        retencionMes6: retencionPct / 100,
      }),
    [referidos, upsellPct, extraArs, n1, retencionPct],
  )

  const commissionPct = Math.round(n1 * 100)

  return (
    <div className="mx-auto my-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="mb-2 text-center text-xl font-bold text-slate-900 sm:text-2xl">
        Simulador: extras pagos, no altas gratis
      </h3>
      <p className="mb-6 text-center text-xs text-slate-500">
        La libreta $0 no te deja comisión. Mové cuántos prenden un extra (Cobrá / AFIP / 2ª caja). El
        precio del extra es <strong>ilustrativo</strong> hasta que HUM firme lista.
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
              <Users className="h-4 w-4" /> Comercios con tu link (ancla gratis)
            </label>
            <span className="font-bold text-blue-600">{referidos}</span>
          </div>
          <Slider min={1} max={200} step={1} value={[referidos]} onValueChange={(val) => setReferidos(val[0])} />
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Percent className="h-4 w-4" /> % que prende un extra a 60 días
            </label>
            <span className="font-bold text-blue-600">{upsellPct}%</span>
          </div>
          <Slider min={1} max={40} step={1} value={[upsellPct]} onValueChange={(val) => setUpsellPct(val[0])} />
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <DollarSign className="h-4 w-4" /> Precio extra / mes (ilustración)
            </label>
            <span className="font-bold text-blue-600">{money(extraArs)}</span>
          </div>
          <Slider
            min={5000}
            max={50000}
            step={1000}
            value={[extraArs]}
            onValueChange={(val) => setExtraArs(val[0])}
          />
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarRange className="h-4 w-4" /> Retención a mes 6 de quienes pagaron
            </label>
            <span className="font-bold text-blue-600">{retencionPct}%</span>
          </div>
          <Slider
            min={10}
            max={100}
            step={5}
            value={[retencionPct]}
            onValueChange={(val) => setRetencionPct(val[0])}
          />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {sim.pagadores} comercios pagarían extra · tu N1 {commissionPct}% · bounty mes 1{" "}
        {Math.round(AFILIADO_RATES.bountyPrimerMes * 100)}%
      </p>

      <div className="mt-4 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Mes 1 (bounty 100% del extra)</p>
          <p className="text-3xl font-extrabold text-blue-600">{money(sim.mes1Bounty)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Mes 6 (recurrente × retención)</p>
          <p className="text-3xl font-extrabold text-slate-900">{money(sim.mes6)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Si retuvieran todos: {money(sim.mensualRecurrente)} / mes
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Simulación educativa. No es promesa de ingresos. Comisión sujeta a pago real del extra y reglas
        del programa. Precio ilustrativo, no lista.
      </p>
    </div>
  )
}
