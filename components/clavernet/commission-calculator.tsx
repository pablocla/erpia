"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { DollarSign, Percent, Users } from "lucide-react"

export function CommissionCalculator() {
  const [clients, setClients] = useState(10)
  const [avgTicket, setAvgTicket] = useState(50000) // 50k ARS mensual
  const [commissionPct, setCommissionPct] = useState(25) // 25%

  const mrr = clients * avgTicket
  const myCommission = (mrr * commissionPct) / 100

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-2xl mx-auto my-12">
      <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Simulador de MRR (Ingreso Recurrente Mensual)</h3>
      
      <div className="space-y-8">
        <div>
          <div className="flex justify-between mb-2">
            <label className="font-semibold text-sm flex items-center gap-2 text-slate-700" title="PyMEs que pagan su suscripción al día.">
              <Users className="w-4 h-4" /> Clientes Activos (Sellers)
            </label>
            <span className="font-bold text-blue-600">{clients}</span>
          </div>
          <Slider min={1} max={100} step={1} value={[clients]} onValueChange={(val) => setClients(val[0])} />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="font-semibold text-sm flex items-center gap-2 text-slate-700" title="Incluye el plan base más módulos extra.">
              <DollarSign className="w-4 h-4" /> Ticket Promedio (Plan ERP + Add-ons)
            </label>
            <span className="font-bold text-blue-600">${avgTicket.toLocaleString()}</span>
          </div>
          <Slider min={25000} max={300000} step={5000} value={[avgTicket]} onValueChange={(val) => setAvgTicket(val[0])} />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="font-semibold text-sm flex items-center gap-2 text-slate-700" title="Depende del volumen de clientes. Elite = 30%.">
              <Percent className="w-4 h-4" /> Nivel de Partner (Comisión Base)
            </label>
            <span className="font-bold text-blue-600">{commissionPct}%</span>
          </div>
          <Slider min={15} max={30} step={5} value={[commissionPct]} onValueChange={(val) => setCommissionPct(val[0])} />
        </div>
      </div>

      <div className="mt-10 bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-slate-500 text-sm">Ingreso Recurrente Total de tu Red</p>
          <p className="text-2xl font-bold text-slate-900">${mrr.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-600 font-bold text-sm">TU COMISIÓN RECURRENTE (x36 meses)</p>
          <p className="text-4xl font-extrabold text-blue-600">${myCommission.toLocaleString()} <span className="text-sm font-medium text-slate-500">/ mes</span></p>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-4">Los resultados de esta calculadora son simulaciones proyectadas y no constituyen una promesa legal de ingresos. El 30% aplica al nivel Elite y se garantiza por 36 meses consecutivos por cliente activo.</p>
    </div>
  )
}
