"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ClipboardList, Map, MapPin, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import {
  CHECKLIST_POST_VISITA,
  DOLORES_PRINCIPALES,
  ENGANCHES_CANDIDATOS,
  NIVELES_INTERES,
  OBJECIONES,
  PREGUNTAS_DIAGNOSTICO,
  PREGUNTAS_EXTRAS_POR_RUBRO,
  RUBROS_RETAIL,
} from "@/lib/ops/comercial-relevamiento-catalog"
import { engancheSugeridoPorRubro } from "@/lib/ops/comercial-relevamiento-enganche"
import { cn } from "@/lib/utils"

type Relevamiento = {
  id: number
  fechaVisita: string
  negocio: string
  nombreContacto: string | null
  localidad: string | null
  rubro: string | null
  nivelInteres: string
  dolorPrincipal: string | null
  trialAceptado: boolean
  engancheCandidato: string | null
}

const initialForm = {
  negocio: "",
  nombreContacto: "",
  direccion: "",
  localidad: "",
  rubro: "almacen",
  telefono: "",
  engancheCandidato: "pos.fiado_barrio",
  respFiado: "",
  respTiempoCobrar: "",
  respFacturaElectronica: "",
  respStockGondola: "",
  respQuienAtiende: "",
  respUsaEscaner: "",
  respVentaFraccionada: "",
  respBalanzaDirecta: "",
  respProduccionPropia: "",
  dolorPrincipal: "fiado",
  nivelInteres: "medio",
  objecionPrincipal: "ninguna",
  demoMostrada: false,
  trialOfrecido: false,
  trialAceptado: false,
  speechUsado: "",
  proximaAccion: "",
  proximaFecha: "",
  notas: "",
}

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

export default function RelevamientosCallePage() {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState<number | null>(null)
  const [lista, setLista] = useState<Relevamiento[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/comercial/relevamientos?limit=20", {
        headers: cloudAuthHeaders(),
      })
      if (res.ok) setLista(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    setForm((f) => ({
      ...f,
      engancheCandidato: engancheSugeridoPorRubro(f.rubro),
    }))
  }, [form.rubro])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function guardar() {
    if (!form.negocio.trim()) return
    setSaving(true)
    setOk(null)

    // Compilar respuestas de preguntas extras a notas
    let compiledNotas = form.notas.trim()
    const extras = PREGUNTAS_EXTRAS_POR_RUBRO[form.rubro]
    if (extras) {
      const extraTexts = extras
        .map((q) => {
          const val = (form[q.id as keyof typeof form] as string || "").trim()
          return val ? `[${q.pregunta}]: ${val}` : null
        })
        .filter(Boolean)
      if (extraTexts.length > 0) {
        compiledNotas = `${extraTexts.join(" | ")}${compiledNotas ? `\n\nNotas generales: ${compiledNotas}` : ""}`
      }
    }

    try {
      const res = await fetch("/api/claver/comercial/relevamientos", {
        method: "POST",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify({
          ...form,
          notas: compiledNotas || null,
          sincronizarPipeline: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setOk(data.relevamiento.id)
        setForm(initialForm)
        await cargar()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      <CloudPageHeader
        icon={ClipboardList}
        eyebrow="Vendedor en calle"
        title="Relevamiento de visita"
        description="Depositá la devolución del local: diagnóstico retail, dolor y próximo paso. Se sincroniza al pipeline del centro de mando."
        badge="Calle"
        onRefresh={cargar}
        loading={loading}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/claver-cloud/comercial/campo">
              <Map className="h-4 w-4 mr-1.5" />
              Mapa y ruta
            </Link>
          </Button>
        }
      />

      {ok && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Relevamiento #{ok} guardado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ya está en el pipeline.{" "}
              <Link href="/claver-cloud" className="text-violet-400 hover:underline">
                Ver centro de mando
              </Link>
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            El local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Comercio *</Label>
            <Input
              placeholder="Ej: Almacén Don Pedro"
              value={form.negocio}
              onChange={(e) => set("negocio", e.target.value)}
              className="text-base"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Dueño / contacto</Label>
            <Input
              placeholder="Nombre"
              value={form.nombreContacto}
              onChange={(e) => set("nombreContacto", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Rubro</Label>
              <Select value={form.rubro} onValueChange={(v) => set("rubro", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RUBROS_RETAIL.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Teléfono</Label>
              <Input
                type="tel"
                placeholder="11…"
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Dirección / referencia</Label>
            <Input
              placeholder="Calle y número, esquina…"
              value={form.direccion}
              onChange={(e) => set("direccion", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Localidad</Label>
            <Input
              value={form.localidad}
              onChange={(e) => set("localidad", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Enganche que ofrecerías</Label>
            <Select value={form.engancheCandidato} onValueChange={(v) => set("engancheCandidato", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENGANCHES_CANDIDATOS.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.label}
                    {e.precioRef ? ` — $${e.precioRef.toLocaleString("es-AR")}/mes` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">5 preguntas diagnóstico</CardTitle>
          <p className="text-xs text-muted-foreground">Lo que escuchaste en el mostrador (15 min máx)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {PREGUNTAS_DIAGNOSTICO.map((p) => (
            <div key={p.id} className="grid gap-1.5">
              <Label className="text-sm font-normal leading-snug">{p.pregunta}</Label>
              <Textarea
                rows={2}
                placeholder={p.placeholder}
                value={form[p.id as keyof typeof form] as string}
                onChange={(e) => set(p.id as keyof typeof form, e.target.value)}
                className="text-base min-h-[72px]"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {PREGUNTAS_EXTRAS_POR_RUBRO[form.rubro] && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-violet-300 font-semibold">Preguntas diagnóstico extra por rubro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {PREGUNTAS_EXTRAS_POR_RUBRO[form.rubro].map((p) => (
              <div key={p.id} className="grid gap-1.5">
                <Label className="text-sm font-normal leading-snug text-violet-200">{p.pregunta}</Label>
                <Textarea
                  rows={2}
                  placeholder={p.placeholder}
                  value={form[p.id as keyof typeof form] as string || ""}
                  onChange={(e) => set(p.id as keyof typeof form, e.target.value)}
                  className="text-base min-h-[72px] bg-background/50 border-violet-500/20 focus-visible:ring-violet-500"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cierre de visita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Dolor principal</Label>
              <Select value={form.dolorPrincipal} onValueChange={(v) => set("dolorPrincipal", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOLORES_PRINCIPALES.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Interés</Label>
              <Select value={form.nivelInteres} onValueChange={(v) => set("nivelInteres", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVELES_INTERES.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Objeción principal</Label>
            <Select value={form.objecionPrincipal} onValueChange={(v) => set("objecionPrincipal", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECIONES.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.demoMostrada} onCheckedChange={(v) => set("demoMostrada", v === true)} />
              Mostré demo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.trialOfrecido} onCheckedChange={(v) => set("trialOfrecido", v === true)} />
              Ofrecí trial 14d
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.trialAceptado} onCheckedChange={(v) => set("trialAceptado", v === true)} />
              Aceptó trial
            </label>
          </div>
          <div className="grid gap-1.5">
            <Label>Próxima acción</Label>
            <Input
              placeholder="Ej: WhatsApp mañana 10hs, volver jueves…"
              value={form.proximaAccion}
              onChange={(e) => set("proximaAccion", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Fecha follow-up</Label>
            <Input
              type="date"
              value={form.proximaFecha}
              onChange={(e) => set("proximaFecha", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Notas libres</Label>
            <Textarea
              rows={3}
              placeholder="Speech que usaste, competencia, familia en el negocio…"
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur md:static md:border-0 md:p-0 md:bg-transparent">
        <Button
          className="w-full h-12 text-base bg-violet-600 hover:bg-violet-500"
          onClick={() => void guardar()}
          disabled={saving || !form.negocio.trim()}
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? "Guardando…" : "Guardar relevamiento + pipeline"}
        </Button>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Visitas recientes</h2>
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no cargaste visitas.</p>
        ) : (
          <div className="space-y-2">
            {lista.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{r.negocio}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtFecha(r.fechaVisita)}</span>
                </div>
                {r.nombreContacto && (
                  <p className="text-xs text-muted-foreground">{r.nombreContacto}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.rubro && (
                    <Badge variant="outline" className="text-xs">
                      {RUBROS_RETAIL.find((x) => x.id === r.rubro)?.label ?? r.rubro}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      r.nivelInteres === "alto" && "border-emerald-500/40 text-emerald-400",
                      r.nivelInteres === "bajo" && "text-muted-foreground",
                    )}
                  >
                    Interés {r.nivelInteres}
                  </Badge>
                  {r.trialAceptado && (
                    <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400">
                      Trial
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Checklist post-visita (mismo día)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-muted-foreground space-y-1">
            {CHECKLIST_POST_VISITA.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}