"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  Dumbbell,
  UtensilsCrossed,
  Wrench,
  Store,
  ArrowRight,
  Sparkles,
  Wallet,
  Rocket,
  ShieldCheck,
} from "lucide-react"
import { RUBROS_SIGNUP } from "@/lib/comercial/rubro-signup"
import { authFetch } from "@/lib/stores/auth-store"

const ICONS: Record<string, typeof Store> = {
  kiosco: Store,
  taller: Wrench,
  gimnasio: Dumbbell,
  oficios: Wrench,
  gastronomia: UtensilsCrossed,
  pyme: Building2,
}

type RubroOption = {
  id: string
  nombre: string
  descripcion: string
  icon: typeof Store
  tag: string
  path: string
}

const RUBROS: RubroOption[] = RUBROS_SIGNUP.map((r) => ({
  id: r.id,
  nombre: r.label,
  descripcion: r.descripcion,
  icon: ICONS[r.id] ?? Store,
  tag: r.marca,
  path: r.landingPath,
}))

export function ExpressOnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedRubro, setSelectedRubro] = useState<RubroOption>(RUBROS[0])
  const [mpAlias, setMpAlias] = useState("")
  const [cuit, setCuit] = useState("")
  const [loading, setLoading] = useState(false)

  const handleComplete = async (withDemoData: boolean) => {
    setLoading(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("claver_user_rubro", selectedRubro.id)
        localStorage.setItem("claver_mp_alias", mpAlias)
        localStorage.setItem("claver_cuit", cuit)
        localStorage.setItem("claver_demo_mode", withDemoData ? "true" : "false")
      }

      try {
        await authFetch("/api/config/empresa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rubro: RUBROS_SIGNUP.find((r) => r.id === selectedRubro.id)?.rubroEmpresa ?? selectedRubro.id,
          }),
        })
      } catch {
        /* el ruteo local igual aplica */
      }

      const dest = withDemoData ? `${selectedRubro.path}?demo=1` : selectedRubro.path
      router.push(dest)
    } catch (e) {
      console.error(e)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl text-slate-100">
      {/* Header Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Configuración Express Claver
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Paso {step} de 3
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                ¿De qué es tu comercio o actividad?
              </h2>
              <p className="text-sm text-slate-400">
                Adaptaremos los botones y la experiencia a la medida de tu día a día.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {RUBROS.map((rubro) => {
                const Icon = rubro.icon
                const isSelected = selectedRubro.id === rubro.id
                return (
                  <button
                    key={rubro.id}
                    onClick={() => setSelectedRubro(rubro)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500"
                        : "border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                          {rubro.tag}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-100 text-sm mb-1">{rubro.nombre}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{rubro.descripcion}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Conectá tus Cobros en MercadoPago
              </h2>
              <p className="text-sm text-slate-400">
                Para que tus clientes te puedan pagar señas y fiados directamente a tu cuenta.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  CVU / Alias de MercadoPago (Opcional)
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ej: mi.local.mp"
                    value={mpAlias}
                    onChange={(e) => setMpAlias(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Podés agregarlo ahora o configurarlo más tarde en la app.
                </p>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  CUIT o DNI para Facturación AFIP (Opcional)
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ej: 20-34567890-9"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                ¿Cómo querés empezar?
              </h2>
              <p className="text-sm text-slate-400">
                Elegí la opción que mejor se adapte a lo que necesitás ahora mismo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                disabled={loading}
                onClick={() => handleComplete(true)}
                className="p-5 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent hover:border-amber-500 hover:bg-amber-500/20 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Recomendado</span>
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Ver Demo con Datos de Ejemplo</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Inyecta 3 fiados/clientes ficticios y ventas de prueba para que veas el potencial completo en 1 clic.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Probar con Datos Demo →
                </span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleComplete(false)}
                className="p-5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Desde cero</span>
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Empezar con la App Limpia</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Comenzá cargando tus propios productos, precios y clientes reales desde el primer momento.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Ir al Dashboard Limpio →
                </span>
              </button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Atrás
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
