"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react"

interface MembresiaSocio {
  id: number
  estado: string
  fechaFin: string
  plan: { nombre: string; precio: number }
  cliente: { id: number; nombre: string; email?: string | null; telefono?: string | null }
  saldoDeuda?: number
}

export function AccesoMostradorModal({
  open,
  onOpenChange,
  membresias,
  onCobrar,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  membresias: MembresiaSocio[]
  onCobrar: (m: MembresiaSocio) => void
}) {
  const [query, setQuery] = useState("")
  const [socioEncontrado, setSocioEncontrado] = useState<MembresiaSocio | null>(null)
  const [buscado, setBuscado] = useState(false)

  const handleBuscar = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    const q = query.trim().toLowerCase()
    const match = membresias.find(
      (m) =>
        m.cliente.nombre.toLowerCase().includes(q) ||
        (m.cliente.telefono && m.cliente.telefono.includes(q))
    )

    setSocioEncontrado(match || null)
    setBuscado(true)
  }

  const esAlDia = socioEncontrado?.estado === "activa"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <QrCode className="h-5 w-5" />
            <DialogTitle>Control de Acceso / Mostrador</DialogTitle>
          </div>
          <DialogDescription>
            Ingresá el DNI, nombre o escaneá el carnet/QR del socio para validar el ingreso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBuscar} className="flex gap-2 py-2">
          <Input
            autoFocus
            placeholder="DNI, nombre o teléfono del socio..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setBuscado(false)
            }}
            className="text-sm font-medium"
          />
          <Button type="submit" className="shrink-0">
            <Search className="h-4 w-4 mr-1.5" />
            Validar
          </Button>
        </form>

        {buscado && (
          <div className="py-2">
            {socioEncontrado ? (
              <div
                className={`p-4 rounded-xl border text-center space-y-3 transition-all ${
                  esAlDia
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : "bg-destructive/10 border-destructive/30 text-destructive dark:text-red-300"
                }`}
              >
                <div className="flex justify-center">
                  {esAlDia ? (
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
                      <XCircle className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold">{socioEncontrado.cliente.nombre}</h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    Plan: <strong>{socioEncontrado.plan.nombre}</strong>
                  </p>
                </div>

                <div className="text-xs py-1.5 px-3 rounded-lg bg-background/60 font-semibold inline-block">
                  {esAlDia ? (
                    <span>✅ Vence el {new Date(socioEncontrado.fechaFin).toLocaleDateString("es-AR")}</span>
                  ) : (
                    <span>❌ Cuota Vencida ({new Date(socioEncontrado.fechaFin).toLocaleDateString("es-AR")})</span>
                  )}
                </div>

                {!esAlDia && (
                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        onOpenChange(false)
                        onCobrar(socioEncontrado)
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                    >
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Cobrar Cuota (${socioEncontrado.plan.precio.toLocaleString("es-AR")})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl border bg-muted/40 text-center space-y-2">
                <AlertTriangle className="h-8 w-8 mx-auto text-amber-500" />
                <p className="text-sm font-semibold">Socio no encontrado</p>
                <p className="text-xs text-muted-foreground">
                  No se encontró ninguna membresía activa o vencida con &quot;{query}&quot;.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
