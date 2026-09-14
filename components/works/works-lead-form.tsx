"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"
import {
  getSegmentPack,
  type WorksSegmentKey,
} from "@/components/works/segment-packs"

type Props = {
  segmento: WorksSegmentKey
  /** Optional override; defaults to pack.formTitle */
  title?: string
  className?: string
  id?: string
}

const fieldClass =
  "min-h-12 h-12 bg-slate-950/60 border-slate-700 text-slate-50 placeholder:text-slate-500"

export function WorksLeadForm({ segmento, title, className, id }: Props) {
  const pack = getSegmentPack(segmento)
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [zona, setZona] = useState("")
  const [kWp, setKWp] = useState("")
  const [techo, setTecho] = useState("")
  const [uso, setUso] = useState("casa")
  const [m2, setM2] = useState("")
  const [potenciaIt, setPotenciaIt] = useState("")
  const [stack, setStack] = useState("")
  const [notas, setNotas] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState<{
    leadId: string
    projectId: string
    presupuestoSoftUrl?: string | null
  } | null>(null)

  const canSubmit = useMemo(() => {
    if (!nombre.trim()) return false
    if (!email.trim() && !telefono.trim()) return false
    if (pack.requireZona && !zona.trim()) return false
    if (pack.requireKwp) {
      const n = Number(kWp)
      if (!Number.isFinite(n) || n < 0.1) return false
    }
    if (pack.requireNotas && !notas.trim()) return false
    return true
  }, [nombre, email, telefono, zona, kWp, notas, pack])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) {
      setError("Completá los campos obligatorios (contacto: email o teléfono).")
      return
    }
    setBusy(true)
    setError("")
    try {
      const payload: Record<string, unknown> = {
        notas: notas.trim() || undefined,
      }
      if (pack.showEnergyFields) {
        payload.kWp = Number(kWp)
        payload.techo = techo.trim() || undefined
        payload.uso = uso || undefined
      }
      if (pack.showInfraExtras) {
        if (m2.trim()) payload.m2 = Number(m2) || m2.trim()
        if (potenciaIt.trim()) payload.potenciaIt = potenciaIt.trim()
      }
      if (segmento === "blockchain" && stack.trim()) {
        payload.stack = stack.trim()
      }

      const res = await fetch("/api/public/works/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmento,
          fuente: "form",
          nombre: nombre.trim(),
          email: email.trim() || undefined,
          telefono: telefono.trim() || undefined,
          zona: zona.trim() || undefined,
          payload,
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
      <Alert
        id={id}
        className={`border-emerald-500/40 bg-emerald-500/10 ${className ?? ""}`}
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <AlertDescription className="space-y-2 text-emerald-100">
          <p className="font-medium">{pack.formSuccess}</p>
          <p className="text-xs text-emerald-200/80">Ref: {done.projectId}</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className={`space-y-4 rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-xl backdrop-blur sm:p-6 ${className ?? ""}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-white">{title ?? pack.formTitle}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {pack.requireZona || pack.requireKwp
            ? "Campos con * son obligatorios. Email o WhatsApp: al menos uno."
            : "Campos con * son obligatorios. Email o WhatsApp: al menos uno."}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`nombre-${segmento}`}>Nombre *</Label>
          <Input
            id={`nombre-${segmento}`}
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido / empresa"
            className={fieldClass}
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`email-${segmento}`}>Email</Label>
          <Input
            id={`email-${segmento}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@empresa.com"
            className={fieldClass}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`tel-${segmento}`}>Teléfono / WhatsApp</Label>
          <Input
            id={`tel-${segmento}`}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 9 11 …"
            className={fieldClass}
            autoComplete="tel"
          />
        </div>
        {(pack.requireZona || segmento !== "blockchain") && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`zona-${segmento}`}>
              Zona{pack.requireZona ? " *" : " (opcional)"}
            </Label>
            <Input
              id={`zona-${segmento}`}
              required={pack.requireZona}
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="CABA / GBA Norte / Rosario…"
              className={fieldClass}
            />
          </div>
        )}

        {pack.showEnergyFields ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`kwp-${segmento}`}>kWp estimado *</Label>
              <Input
                id={`kwp-${segmento}`}
                type="number"
                min={0.1}
                step="0.1"
                required
                value={kWp}
                onChange={(e) => setKWp(e.target.value)}
                placeholder="5"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`uso-${segmento}`}>Uso</Label>
              <select
                id={`uso-${segmento}`}
                className={`flex w-full rounded-md border border-slate-700 px-3 text-sm ${fieldClass}`}
                value={uso}
                onChange={(e) => setUso(e.target.value)}
              >
                <option value="casa">Casa</option>
                <option value="pyme">PyME</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`techo-${segmento}`}>Tipo de techo</Label>
              <Input
                id={`techo-${segmento}`}
                value={techo}
                onChange={(e) => setTecho(e.target.value)}
                placeholder="Chapa / teja / losa…"
                className={fieldClass}
              />
            </div>
          </>
        ) : null}

        {pack.showInfraExtras ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`m2-${segmento}`}>m² (aprox.)</Label>
              <Input
                id={`m2-${segmento}`}
                value={m2}
                onChange={(e) => setM2(e.target.value)}
                placeholder="500"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pot-${segmento}`}>Potencia IT (colo)</Label>
              <Input
                id={`pot-${segmento}`}
                value={potenciaIt}
                onChange={(e) => setPotenciaIt(e.target.value)}
                placeholder="kW / racks"
                className={fieldClass}
              />
            </div>
          </>
        ) : null}

        {segmento === "blockchain" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`stack-${segmento}`}>Stack (opcional)</Label>
            <Input
              id={`stack-${segmento}`}
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="Solidity / EVM / nodos…"
              className={fieldClass}
            />
          </div>
        ) : null}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`notas-${segmento}`}>
            Notas{pack.requireNotas ? " *" : ""}
          </Label>
          <Textarea
            id={`notas-${segmento}`}
            required={pack.requireNotas}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder={
              segmento === "infra"
                ? "Alcance: civil / nave / colo…"
                : segmento === "blockchain"
                  ? "Solidity / audit / nodos / security…"
                  : "Contanos el alcance…"
            }
            className="min-h-[96px] border-slate-700 bg-slate-950/60 text-slate-50 placeholder:text-slate-500"
          />
        </div>
      </div>

      {pack.showBlockchainDisclaimer ? (
        <p className="text-xs font-medium text-amber-300/90">
          Sin custody · Sin exchange
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={busy || !canSubmit}
        size="lg"
        className="min-h-12 h-12 w-full bg-amber-400 font-semibold text-slate-950 hover:bg-amber-300"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {pack.ctaPrimary}
      </Button>
      <p className="text-center text-xs leading-relaxed text-slate-400">{pack.ctaMicro}</p>
    </form>
  )
}
