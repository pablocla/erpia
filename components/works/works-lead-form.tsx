"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"

type Props = {
  segmento: "energy" | "infra" | "blockchain"
  title?: string
  showEnergyFields?: boolean
}

export function WorksLeadForm({ segmento, title, showEnergyFields }: Props) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [zona, setZona] = useState("")
  const [kWp, setKWp] = useState("")
  const [techo, setTecho] = useState("")
  const [uso, setUso] = useState("casa")
  const [notas, setNotas] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState<{ leadId: string; projectId: string; presupuestoSoftUrl?: string | null } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/public/works/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmento,
          fuente: "form",
          nombre,
          email: email || undefined,
          telefono: telefono || undefined,
          zona: zona || undefined,
          payload: {
            kWp: kWp ? Number(kWp) : undefined,
            techo: techo || undefined,
            uso: uso || undefined,
            notas: notas || undefined,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setDone({
        leadId: data.leadId,
        projectId: data.projectId,
        presupuestoSoftUrl: data.presupuestoSoftUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Alert className="border-emerald-500/40 bg-emerald-500/10">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <AlertDescription className="text-emerald-100 space-y-2">
          <p className="font-medium">Lead registrado. Te contactamos a la brevedad.</p>
          <p className="text-xs text-emerald-200/80">Ref: {done.projectId}</p>
          {done.presupuestoSoftUrl ? (
            <p className="text-xs">
              Link presupuesto/seña (Soft stub):{" "}
              <a className="underline" href={done.presupuestoSoftUrl}>
                abrir
              </a>
            </p>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-xl">
      <div>
        <h2 className="text-lg font-semibold text-white">{title ?? "Dejanos tus datos"}</h2>
        <p className="text-sm text-slate-400">Segmento: {segmento}. Persistimos en el motor Works.</p>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido / empresa" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@empresa.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tel">Teléfono / WhatsApp</Label>
          <Input id="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+54 9 11 ..." />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="zona">Zona</Label>
          <Input id="zona" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="CABA / GBA Norte / Rosario..." />
        </div>
        {showEnergyFields || segmento === "energy" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="kwp">kWp estimado</Label>
              <Input id="kwp" type="number" min={0} step="0.1" value={kWp} onChange={(e) => setKWp(e.target.value)} placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uso">Uso</Label>
              <select
                id="uso"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={uso}
                onChange={(e) => setUso(e.target.value)}
              >
                <option value="casa">Casa</option>
                <option value="pyme">PyME</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="techo">Tipo de techo</Label>
              <Input id="techo" value={techo} onChange={(e) => setTecho(e.target.value)} placeholder="Chapa / teja / losa..." />
            </div>
          </>
        ) : null}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notas">Notas</Label>
          <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} placeholder="Contanos el alcance..." />
        </div>
      </div>
      <Button type="submit" disabled={busy || !nombre.trim()} className="w-full">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Enviar consulta {segmento}
      </Button>
    </form>
  )
}
