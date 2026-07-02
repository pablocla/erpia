import { CommissionCalculator } from "@/components/clavernet/commission-calculator"
import { Copy, Users, DollarSign, Wallet } from "lucide-react"

export default function ClavernetDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Mi Portal de Partner</h1>
      <p className="text-slate-500 mb-8">Nivel actual: <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Pro Seller</span></p>

      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Clientes Activos</h3>
          </div>
          <p className="text-3xl font-bold">14</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-semibold text-sm">MRR Generado</h3>
          </div>
          <p className="text-3xl font-bold">$1.2M</p>
        </div>

        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-sm md:col-span-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Wallet className="w-32 h-32 -mt-4 -mr-4" />
          </div>
          <div className="relative z-10">
            <h3 className="font-semibold text-sm text-blue-100 mb-2">A cobrar este mes</h3>
            <p className="text-4xl font-extrabold mb-4">$360,000</p>
            <button className="bg-white text-blue-600 font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
              Solicitar Retiro
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-10">
        <h3 className="font-bold text-lg mb-4">Tu Enlace de Afiliado</h3>
        <p className="text-sm text-slate-500 mb-4">Enviá este enlace a tus clientes. Cualquier empresa que se registre y pague una suscripción quedará ligada a tu cuenta, garantizando tu MRR por 36 meses consecutivos.</p>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl max-w-2xl">
          <code className="text-sm text-blue-700 flex-1">https://claver.com.ar/register?ref=partner_PRO_9021</code>
          <button className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-100">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CommissionCalculator />
    </div>
  )
}
