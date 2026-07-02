"use client"

import { Trophy, TrendingUp, Star } from "lucide-react"

const TOP_SELLERS = [
  { id: 1, name: "Consultora Rosario", level: "Elite", mrr: "$12,450", appsSold: 145 },
  { id: 2, name: "Tech Implementers", level: "Pro", mrr: "$8,200", appsSold: 98 },
  { id: 3, name: "ERP Solutions B2B", level: "Pro", mrr: "$5,100", appsSold: 64 },
]

const TOP_APPS = [
  { id: 1, name: "Cobranzas IA", dev: "DevStudio Arg", installs: 850, rating: 4.9 },
  { id: 2, name: "Integrador AFIP+MercadoPago", dev: "Fintech Solutions", installs: 620, rating: 4.8 },
  { id: 3, name: "Guardián de Caja", dev: "Claver Core", installs: 430, rating: 4.7 },
]

export function TopSellersBoard() {
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Hall of Fame</h2>
          <p className="text-slate-600 mt-2">Los partners más exitosos de la red Clavernet este mes.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Top Sellers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-300" />
                  Top Sellers
                </h3>
                <p className="text-blue-100 text-sm opacity-90 mt-1">Mayor Ingreso Recurrente Mensual (MRR)</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-50" />
            </div>
            <div className="p-0">
              {TOP_SELLERS.map((seller, index) => (
                <div key={seller.id} className="flex items-center justify-between p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{seller.name}</h4>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{seller.level}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{seller.mrr}</p>
                    <p className="text-xs text-slate-500">{seller.appsSold} ventas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Apps */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  Top Apps
                </h3>
                <p className="text-emerald-100 text-sm opacity-90 mt-1">Módulos más vendidos por Developers</p>
              </div>
              <CodeIcon className="h-8 w-8 opacity-50" />
            </div>
            <div className="p-0">
              {TOP_APPS.map((app, index) => (
                <div key={app.id} className="flex items-center justify-between p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{app.name}</h4>
                      <p className="text-xs text-slate-500">por {app.dev}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{app.installs} inst.</p>
                    <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                      {app.rating} <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CodeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
