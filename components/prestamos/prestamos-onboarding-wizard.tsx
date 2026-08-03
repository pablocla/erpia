"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  CheckCircle,
  Sparkles,
  Calendar,
  DollarSign,
  ArrowRight
} from "lucide-react"

interface PrestamosOnboardingWizardProps {
  onComplete: (config: {
    capitalInicial: number
    interesEstimado: number
    frecuenciaDefault: string
  }) => void
}

export function PrestamosOnboardingWizard({ onComplete }: PrestamosOnboardingWizardProps) {
  const [open, setOpen] = useState(false)

  // Formulario ultra simple
  const [capitalInicial, setCapitalInicial] = useState(300000)
  const [interesEstimado, setInteresEstimado] = useState(20) // 20% de interés
  const [frecuenciaDefault, setFrecuenciaDefault] = useState("Semanal")

  useEffect(() => {
    const completed = localStorage.getItem("claver:lazaro_onboarding_completed")
    if (!completed) {
      setOpen(true)
    }
  }, [])

  const handleFinish = () => {
    localStorage.setItem("claver:lazaro_onboarding_completed", "true")
    localStorage.setItem("claver:lazaro_capital_inicial", capitalInicial.toString())
    localStorage.setItem("claver:lazaro_interes_estimado", interesEstimado.toString())
    localStorage.setItem("claver:lazaro_frecuencia_default", frecuenciaDefault)

    onComplete({
      capitalInicial,
      interesEstimado,
      frecuenciaDefault,
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-slate-900 text-slate-100 border-slate-800 p-6">
        <DialogHeader className="text-left space-y-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                ¡Bienvenido a Lázaro Préstamos!
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Configuremos tu libreta de cobros en menos de 30 segundos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Pregunta 1: Capital */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              1. ¿Cuánto dinero tenés disponible para prestar hoy?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
              <Input
                type="number"
                value={capitalInicial}
                onChange={(e) => setCapitalInicial(Number(e.target.value))}
                className="pl-7 bg-slate-800 border-slate-700 text-white font-bold text-lg"
              />
            </div>
          </div>

          {/* Pregunta 2: Frecuencia */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              2. ¿Cada cuánto acostumbrás a cobrar la cuota?
            </Label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Diario", sub: "Todos los días" },
                { label: "Semanal", sub: "Por semana" },
                { label: "Mensual", sub: "Por mes" },
              ].map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFrecuenciaDefault(f.label)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    frecuenciaDefault === f.label
                      ? "bg-blue-600 border-blue-500 text-white shadow-md font-semibold"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[10px] opacity-75">{f.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pregunta 3: Interés Ganancia */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
              3. ¿Cuánto querés ganar de interés promedio?
            </Label>
            <div className="flex items-center gap-3 bg-slate-800/70 p-3 rounded-xl border border-slate-700">
              <Input
                type="number"
                value={interesEstimado}
                onChange={(e) => setInteresEstimado(Number(e.target.value))}
                className="w-24 bg-slate-900 border-slate-700 text-white font-bold text-center text-lg"
              />
              <span className="text-slate-300 font-bold">% de recargo</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                Ej: Prestas $10.000 ➔ Cobrás ${(10000 * (1 + interesEstimado / 100)).toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-800">
          <Button
            onClick={handleFinish}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-11 shadow-lg"
          >
            <CheckCircle className="mr-2 h-4 w-4" /> ¡Guardar y Empezar a Anotar Cobros!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
