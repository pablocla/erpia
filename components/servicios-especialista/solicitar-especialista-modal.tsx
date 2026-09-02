"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Rocket,
  Database,
  ShieldCheck,
  CheckCircle2,
  Headphones,
  Sparkles,
  Loader2,
  Clock,
  CreditCard,
  Ban,
} from "lucide-react"
import type { PackEspecialistaPublico } from "@/lib/servicios-especialista/especialista-catalog"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

const ICONS = {
  Rocket,
  Database,
  ShieldCheck,
} as const

type SlotOpt = { id: string; iso: string; label: string }

type OrdenResumen = {
  id: number
  pack: PackEspecialistaPublico
  estadoPago: "pendiente" | "pagado" | "cancelado"
  slotLabel: string | null
  checkoutUrl: string | null
  mock: boolean
}

export function SolicitarEspecialistaModal({
  open,
  onOpenChange,
  defaultPackId = "puesta_a_punto_express",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPackId?: string
}) {
  const [packs, setPacks] = useState<PackEspecialistaPublico[]>([])
  const [slots, setSlots] = useState<SlotOpt[]>([])
  const [packSeleccionado, setPackSeleccionado] = useState<string>(defaultPackId)
  const [telefono, setTelefono] = useState("")
  const [slotIso, setSlotIso] = useState("")
  const [solicitando, setSolicitando] = useState(false)
  const [ordenPagada, setOrdenPagada] = useState<OrdenResumen | null>(null)
  const [mock, setMock] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      try {
        const res = await authFetch("/api/servicios/especialista")
        const data = await res.json()
        if (cancelled || !data.ok) return
        setPacks(data.packs ?? [])
        setSlots(data.slots ?? [])
        setMock(Boolean(data.mock))
        const pagada = (data.ordenes as OrdenResumen[] | undefined)?.find((o) => o.estadoPago === "pagado")
        if (pagada) setOrdenPagada(pagada)
      } catch {
        /* el POST igual valida */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const packActivo = packs.find((p) => p.id === packSeleccionado)

  const handlePagar = async () => {
    setSolicitando(true)
    try {
      const res = await authFetch("/api/servicios/especialista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: packSeleccionado,
          telefonoContacto: telefono,
          slotIso: slotIso || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast({
          title: "No se pudo iniciar el pago",
          description: data.error ?? "Revisá el WhatsApp y el pack.",
          variant: "destructive",
        })
        return
      }

      if (data.mock && data.orden?.id) {
        const confirm = await authFetch("/api/servicios/especialista", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmarMock: true, ordenId: data.orden.id }),
        })
        const confirmed = await confirm.json()
        if (confirmed.ok && confirmed.orden) {
          setOrdenPagada(confirmed.orden)
          toast({
            title: "Pago de prueba acreditado",
            description: "En producción esto abre Mercado Pago. El pedido ya está en el pipeline.",
          })
          return
        }
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      toast({
        title: "Pedido creado",
        description: "No hay checkout configurado. El equipo te contacta al WhatsApp.",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud.",
        variant: "destructive",
      })
    } finally {
      setSolicitando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Headphones className="h-5 w-5" />
            <DialogTitle>Especialista 1 a 1 — alcance cerrado</DialogTitle>
          </div>
          <DialogDescription>
            El software arranca gratis. Esto es un servicio de horas: pagás, reservamos el turno, un
            implementador hace el trabajo. Sin WhatsApp fantasma y sin SLA de 15 minutos.
          </DialogDescription>
        </DialogHeader>

        {ordenPagada ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-sm">
            <p className="flex items-start gap-2 font-medium text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              Pedido #{ordenPagada.id} de {ordenPagada.pack.nombre} acreditado.
            </p>
            <p className="text-xs text-muted-foreground">
              Un implementador te escribe al WhatsApp que dejaste
              {ordenPagada.slotLabel ? ` · turno ${ordenPagada.slotLabel}` : " para coordinar horario hábil"}.
            </p>
            <Button className="w-full mt-2" onClick={() => onOpenChange(false)}>
              Seguir usando el sistema
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto text-xs">
            <div className="grid gap-3 sm:grid-cols-3">
              {(packs.length ? packs : []).map((pack) => {
                const seleccionado = packSeleccionado === pack.id
                const Icon = ICONS[pack.icono] ?? Rocket
                return (
                  <button
                    type="button"
                    key={pack.id}
                    onClick={() => setPackSeleccionado(pack.id)}
                    className={`text-left rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                      seleccionado
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <Icon className="h-4 w-4 text-primary" />
                        {pack.popular && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                            Recomendado
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-xs leading-tight">{pack.nombre}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{pack.descripcionCorta}</p>
                    </div>
                    <div className="pt-3 mt-3 border-t">
                      <p className="text-base font-extrabold text-foreground">
                        ${pack.precioARS.toLocaleString("es-AR")}
                        {pack.tipo === "recurrente" ? (
                          <span className="text-[10px] font-medium text-muted-foreground"> /mes</span>
                        ) : null}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {pack.duracionHoras}h {pack.tipo === "recurrente" ? "por mes" : "cerradas"}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {packActivo && (
              <div className="p-4 rounded-xl border bg-muted/40 space-y-2.5">
                <p className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Qué incluye — y qué no
                </p>
                <ul className="space-y-1.5">
                  {packActivo.entregables.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-muted-foreground text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {packActivo.exclusiones.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-muted-foreground text-xs">
                      <Ban className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground pt-1">{packActivo.sla}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp de contacto</Label>
                <Input
                  placeholder="Ej: 11 2345-6789"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="text-xs"
                  inputMode="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Turno preferido (hábil)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  value={slotIso}
                  onChange={(e) => setSlotIso(e.target.value)}
                >
                  <option value="">Coordinar después del pago</option>
                  {slots.map((s) => (
                    <option key={s.id} value={s.iso}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              El trabajo se agenda cuando Mercado Pago acredita. {mock ? "Este entorno está en modo prueba." : "Vas a ir al checkout de Mercado Pago."}
            </p>
          </div>
        )}

        {!ordenPagada && (
          <div className="pt-2 border-t flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Seguir gratis
            </Button>
            <Button
              onClick={() => void handlePagar()}
              disabled={solicitando || !packActivo}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              {solicitando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Abriendo pago...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  {mock ? "Registrar pedido de prueba" : `Pagar $${packActivo?.precioARS.toLocaleString("es-AR") ?? ""}`}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
