"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Share2,
} from "lucide-react"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

export function AiDailySummaryModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [dias, setDias] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    resumenTexto: string
    metricas: {
      totalVentasArs: number
      cantidadTickets: number
      ticketPromedioArs: number
      gananciaEstimadaArs: number
      deudaFiadosArs: number
      topProductos: { nombre: string; cantidad: number }[]
    }
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const fetchResumen = async (periodoDias: number) => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/ia/resumen-negocio?dias=${periodoDias}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error generando el resumen")
      setData(json)
    } catch (err) {
      toast({
        title: "Error al generar resumen",
        description: err instanceof Error ? err.message : "Intentá nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchResumen(dias)
    }
  }, [open, dias])

  const handleCopiarWhatsApp = () => {
    if (!data?.resumenTexto) return
    const textoCompleto = `📊 *Resumen de ${dias === 1 ? "Hoy" : `los últimos ${dias} días`}*\n\n${data.resumenTexto}\n\n_Generado por Claver ERP_`
    navigator.clipboard.writeText(textoCompleto)
    setCopied(true)
    toast({
      title: "¡Copiado para WhatsApp!",
      description: "Pegalo en tu chat o grupo de trabajo.",
    })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <DialogTitle>¿Cómo me fue {dias === 1 ? "hoy" : `estos ${dias} días`}?</DialogTitle>
            </div>
            <div className="flex gap-1 bg-muted p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setDias(1)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  dias === 1 ? "bg-background font-semibold shadow-xs" : "text-muted-foreground"
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDias(7)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  dias === 7 ? "bg-background font-semibold shadow-xs" : "text-muted-foreground"
                }`}
              >
                7 días
              </button>
            </div>
          </div>
          <DialogDescription>
            Briefing comercial generado en tiempo real por tu copiloto de IA.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Consolidando tickets y calculando márgenes...</p>
          </div>
        ) : data ? (
          <div className="space-y-4 py-1">
            {/* KPI quick grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Ventas</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ${data.metricas.totalVentasArs.toLocaleString("es-AR")}
                </p>
                <p className="text-[10px] text-muted-foreground">{data.metricas.cantidadTickets} tickets</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium uppercase">Ganancia Est.</p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  ${data.metricas.gananciaEstimadaArs.toLocaleString("es-AR")}
                </p>
                <p className="text-[10px] text-emerald-600">Margen ~35%</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-amber-800 dark:text-amber-400 font-medium uppercase">Fiados</p>
                <p className="text-base font-bold text-amber-800 dark:text-amber-400">
                  ${data.metricas.deudaFiadosArs.toLocaleString("es-AR")}
                </p>
                <p className="text-[10px] text-amber-700">En la calle</p>
              </div>
            </div>

            {/* AI Natural text */}
            <div className="rounded-xl border bg-card p-3.5 shadow-xs text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
              {data.resumenTexto}
            </div>

            <Button
              onClick={handleCopiarWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Copiar Resumen para WhatsApp
                </>
              )}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
