"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarClock, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores/auth-store"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"

type Slot = {
  id: string
  iso: string
  fecha: string
  hora: string
  label: string
}

type Pendiente = {
  id: number
  proximaFecha: string | null
  proximaAccion: string | null
}

export type PactarImplementacionArcaProps = {
  defaultArca?: boolean
  defaultWhatsapp?: boolean
  triggerLabel?: string
  triggerClassName?: string
  variant?: "default" | "landing" | "compact"
  pagina?: string
  /** If provided, parent controls the dialog. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function PactarImplementacionArca({
  defaultArca = true,
  defaultWhatsapp = true,
  triggerLabel = "Pactar implementación ARCA / WhatsApp",
  triggerClassName,
  variant = "default",
  pagina,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: PactarImplementacionArcaProps) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [slots, setSlots] = useState<Slot[]>([])
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [incluyeArca, setIncluyeArca] = useState(defaultArca)
  const [incluyeWhatsapp, setIncluyeWhatsapp] = useState(defaultWhatsapp)
  const [slotIso, setSlotIso] = useState<string>("")
  const [nombreAccesoArca, setNombreAccesoArca] = useState("")
  const [nombre, setNombre] = useState(user?.nombre ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [telefono, setTelefono] = useState("")
  const [hecho, setHecho] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = token
        ? await authFetch("/api/comercial/implementacion-arca")
        : await fetch("/api/comercial/implementacion-arca")
      if (!res.ok) throw new Error("No se pudieron cargar los turnos")
      const data = await res.json()
      setSlots(Array.isArray(data.slots) ? data.slots : [])
      setPendiente(data.pendiente ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar turnos")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (open) {
      setHecho(null)
      setError(null)
      void cargar()
    }
  }, [open, cargar])

  const grupos = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const list = map.get(s.fecha) ?? []
      list.push(s)
      map.set(s.fecha, list)
    }
    return [...map.entries()]
  }, [slots])

  async function confirmar() {
    setError(null)
    if (!slotIso) {
      setError("Elegí un turno.")
      return
    }
    if (!incluyeArca && !incluyeWhatsapp) {
      setError("Marcá ARCA, WhatsApp o ambos.")
      return
    }
    if (!token && (!nombre.trim() || !email.trim())) {
      setError("Nombre y email para confirmar el turno.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        slotIso,
        incluyeArca,
        incluyeWhatsapp,
        nombreAccesoArca,
        nombre,
        email,
        telefono,
        pagina: pagina ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
        website: "",
      }
      const res = token
        ? await authFetch("/api/comercial/implementacion-arca", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        : await fetch("/api/comercial/implementacion-arca", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo pactar el turno")
      setHecho(data.mensaje)
      toast({
        title: "Turno pactado",
        description: "En Claver Cloud queda pendiente el upgrade y el certificado.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al pactar")
    } finally {
      setSaving(false)
    }
  }

  const landing = variant === "landing"

  return (
    <>
      {!hideTrigger && (
        <Button
          type="button"
          variant={landing ? "outline" : variant === "compact" ? "outline" : "default"}
          className={cn(
            variant === "compact" && "h-8 text-xs",
            landing &&
              "h-12 border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-white",
            triggerClassName,
          )}
          onClick={() => setOpen(true)}
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Pactar implementación ARCA / WhatsApp</DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed">
              El turno es con quien tenga acceso a ARCA para emitir el certificado de factura
              electrónica. Mientras tanto podés vender y emitir ticket interno, sin CAE.
            </DialogDescription>
          </DialogHeader>

          {hecho ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm space-y-2">
              <p className="flex items-start gap-2 font-medium text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                {hecho}
              </p>
              <p className="text-xs text-muted-foreground">
                Seguí cobrando con ticket interno. Cuando el certificado esté listo, se prenden
                Factura A/B/C y WhatsApp de cobro.
              </p>
              <Button className="w-full mt-2" onClick={() => setOpen(false)}>
                Seguir vendiendo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendiente?.proximaFecha && (
                <p className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-100">
                  Ya tenés un turno pendiente
                  {pendiente.proximaAccion ? `: ${pendiente.proximaAccion}` : ""}. Si elegís otro,
                  se reprograma.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={incluyeArca}
                    onChange={(e) => setIncluyeArca(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">Certificado ARCA</span>
                    <span className="block text-xs text-muted-foreground">Factura A/B/C con CAE</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={incluyeWhatsapp}
                    onChange={(e) => setIncluyeWhatsapp(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">WhatsApp de cobro</span>
                    <span className="block text-xs text-muted-foreground">Avisos al deudor</span>
                  </span>
                </label>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="acceso-arca">Quién tiene acceso a ARCA (para el certificado)</Label>
                <Input
                  id="acceso-arca"
                  placeholder="Dueño, contador o quien opera la clave fiscal"
                  value={nombreAccesoArca}
                  onChange={(e) => setNombreAccesoArca(e.target.value)}
                />
              </div>

              {!token && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="pactar-nombre">Tu nombre</Label>
                    <Input
                      id="pactar-nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="pactar-email">Email</Label>
                    <Input
                      id="pactar-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="pactar-tel">WhatsApp / teléfono</Label>
                    <Input
                      id="pactar-tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Elegí un turno (hora Argentina)
                </p>
                {loading ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando turnos…
                  </p>
                ) : grupos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay turnos libres esta semana.</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {grupos.map(([fecha, daySlots]) => (
                      <div key={fecha}>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                          {daySlots[0]?.label.replace(/,?\s*\d{2}:\d{2}.*/, "") || fecha}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {daySlots.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSlotIso(s.iso)}
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                                slotIso === s.iso
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "hover:border-emerald-500/50",
                              )}
                            >
                              {s.hora} hs
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  En Claver Cloud aparece como pendiente: cliente quiere upgrade y sacar el
                  certificado. El ticket interno no se corta.
                </span>
              </div>

              <Button className="w-full" onClick={() => void confirmar()} disabled={saving || loading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="mr-2 h-4 w-4" />
                )}
                Confirmar turno
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
