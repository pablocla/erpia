"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Server,
  Shield,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader, PageShell } from "@/components/layout"
import { CLAVER_GROUP } from "@/lib/brand"
import { CCA_FASES, type CcaFaseCodigo } from "@/lib/ops/implementacion-types"

type FaseEstado = {
  completado: boolean
  fecha?: string | null
  notas?: string | null
  auto?: boolean
}

type ReadinessItem = {
  id: string
  label: string
  estado: "ok" | "warn" | "fail"
  detalle?: string
}

type ReadinessReport = {
  listoGoLive: boolean
  score: number
  items: ReadinessItem[]
  rubroChecks: ReadinessItem[]
}

type Acta = {
  id: number
  tipo: string
  titulo: string
  contenido: string | null
  firmadoPor: string | null
  firmadoCliente: boolean
  createdAt: string
}

type ProyectoDetalle = {
  id: number
  codigo: string
  estado: string
  faseActual: string
  porcentajeAvance: number
  planComercial: string | null
  analistaEmail: string | null
  fechaVenta: string | null
  fechaKickoff: string | null
  fechaObjetivoGoLive: string | null
  fechaGoLiveReal: string | null
  urlAcceso: string | null
  packOnboardEntregado: boolean
  notas: string | null
  fases: Record<string, FaseEstado>
  empresa: {
    id: number
    nombre: string
    razonSocial: string
    rubro: string
    cuit: string
    entornoAfip: string
    planHosting: string
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ImplementacionDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [urlAcceso, setUrlAcceso] = useState("")
  const [notas, setNotas] = useState("")
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null)
  const [actas, setActas] = useState<Acta[]>([])
  const [actaTipo, setActaTipo] = useState("kickoff")
  const [actaTitulo, setActaTitulo] = useState("")
  const [actaContenido, setActaContenido] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const statusRes = await fetch("/api/claver/analista/status", { headers: authHeaders() })
      const status = await statusRes.json()
      if (!status.isAnalyst) {
        setAutorizado(false)
        return
      }
      setAutorizado(true)

      const res = await fetch(`/api/claver/implementaciones/${id}`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setProyecto(data)
      setUrlAcceso(data.urlAcceso ?? "")
      setNotas(data.notas ?? "")

      const [readRes, actasRes] = await Promise.all([
        fetch(`/api/claver/ops/readiness/${data.empresa.id}`, { headers: authHeaders() }),
        fetch(`/api/claver/implementaciones/${id}/actas`, { headers: authHeaders() }),
      ])
      if (readRes.ok) setReadiness(await readRes.json())
      if (actasRes.ok) {
        const actasData = await actasRes.json()
        setActas(Array.isArray(actasData.data) ? actasData.data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/claver/implementaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setProyecto(data)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleFase(codigo: CcaFaseCodigo, completado: boolean) {
    await patch({ fase: { codigo, completado } })
  }

  async function guardarDatos() {
    await patch({ urlAcceso, notas, packOnboardEntregado: proyecto?.packOnboardEntregado })
  }

  async function crearActa() {
    if (!actaTitulo.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/claver/implementaciones/${id}/actas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          tipo: actaTipo,
          titulo: actaTitulo,
          contenido: actaContenido || undefined,
        }),
      })
      if (res.ok) {
        setActaTitulo("")
        setActaContenido("")
        await cargar()
      }
    } finally {
      setSaving(false)
    }
  }

  async function exportarDossier() {
    const res = await fetch(`/api/claver/implementaciones/${id}/export?download=1`, {
      headers: authHeaders(),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dossier-${proyecto?.codigo ?? id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function readinessIcon(estado: ReadinessItem["estado"]) {
    if (estado === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
    if (estado === "warn") return <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
    return <XCircle className="h-4 w-4 text-red-600 shrink-0" />
  }

  if (autorizado === null || loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando proyecto…
      </div>
    )
  }

  if (!autorizado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Acceso restringido</h1>
        <p className="text-muted-foreground">Panel exclusivo para analistas {CLAVER_GROUP.name}.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>Volver</Button>
      </div>
    )
  }

  if (!proyecto) {
    return <p className="p-6 text-muted-foreground">Proyecto no encontrado.</p>
  }

  return (
    <PageShell>
      <div className="mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/claver/implementaciones">← Torre de implementaciones</Link>
        </Button>
      </div>
      <PageHeader
        title={proyecto.empresa.nombre}
        description={`${proyecto.codigo} · ${proyecto.empresa.razonSocial} · CUIT ${proyecto.empresa.cuit}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/claver/operaciones/${proyecto.empresa.id}`}>
                <Server className="h-4 w-4 mr-2" />
                Panel VPS
              </Link>
            </Button>
            <Button variant="outline" onClick={exportarDossier} disabled={saving}>
              <Download className="h-4 w-4 mr-2" />
              Exportar dossier
            </Button>
            <Button variant="outline" onClick={cargar} disabled={saving}>
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Fases CCA
              <Badge variant="outline">{proyecto.porcentajeAvance}%</Badge>
            </CardTitle>
            <Progress value={proyecto.porcentajeAvance} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {CCA_FASES.map((f) => {
              const estado = proyecto.fases[f.codigo]
              const done = estado?.completado
              return (
                <div
                  key={f.codigo}
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0"
                    disabled={saving}
                    onClick={() => toggleFase(f.codigo, !done)}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{f.codigo}</span>
                      <span className="text-sm">{f.nombre}</span>
                      {estado?.auto && (
                        <Badge variant="secondary" className="text-[10px]">Auto</Badge>
                      )}
                      {proyecto.faseActual === f.codigo && !done && (
                        <Badge className="text-[10px]">Actual</Badge>
                      )}
                    </div>
                    {estado?.notas && (
                      <p className="text-xs text-muted-foreground mt-1">{estado.notas}</p>
                    )}
                    {estado?.fecha && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(estado.fecha).toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{f.peso}%</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pack ONBOARD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs">URL de acceso</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={urlAcceso} onChange={(e) => setUrlAcceso(e.target.value)} />
                  {urlAcceso && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={urlAcceso} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border p-2">
                  <p className="text-muted-foreground">AFIP</p>
                  <p className="font-medium">{proyecto.empresa.entornoAfip}</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-muted-foreground">Hosting</p>
                  <p className="font-medium">{proyecto.empresa.planHosting}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs">Notas del proyecto</Label>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={guardarDatos} disabled={saving}>
                Guardar pack ONBOARD
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={saving || proyecto.packOnboardEntregado}
                onClick={() => patch({ packOnboardEntregado: true, fase: { codigo: "CCA-030", completado: true, notas: "Pack ONBOARD entregado al cliente" } })}
              >
                {proyecto.packOnboardEntregado ? "ONBOARD entregado" : "Marcar ONBOARD entregado"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Analista:</span> {proyecto.analistaEmail ?? "—"}</p>
              <p><span className="text-muted-foreground">Plan:</span> {proyecto.planComercial ?? "—"}</p>
              <p><span className="text-muted-foreground">Estado:</span> {proyecto.estado}</p>
              {proyecto.fechaObjetivoGoLive && (
                <p>
                  <span className="text-muted-foreground">Go-live objetivo:</span>{" "}
                  {new Date(proyecto.fechaObjetivoGoLive).toLocaleDateString("es-AR")}
                </p>
              )}
              {proyecto.fechaGoLiveReal && (
                <p>
                  <span className="text-muted-foreground">Go-live real:</span>{" "}
                  {new Date(proyecto.fechaGoLiveReal).toLocaleDateString("es-AR")}
                </p>
              )}
            </CardContent>
          </Card>

          {readiness && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Readiness go-live
                  <Badge variant={readiness.listoGoLive ? "default" : "secondary"}>
                    {readiness.score}%
                  </Badge>
                </CardTitle>
                <Progress value={readiness.score} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {readiness.listoGoLive && (
                  <p className="text-emerald-700 text-xs font-medium">Listo para go-live</p>
                )}
                <div className="space-y-1.5">
                  {readiness.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      {readinessIcon(item.estado)}
                      <div>
                        <p className="text-xs font-medium">{item.label}</p>
                        {item.detalle && (
                          <p className="text-[10px] text-muted-foreground">{item.detalle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {readiness.rubroChecks.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground font-medium pt-1">Checklist rubro</p>
                    <div className="space-y-1.5">
                      {readiness.rubroChecks.map((item) => (
                        <div key={item.id} className="flex items-start gap-2">
                          {readinessIcon(item.estado)}
                          <div>
                            <p className="text-xs font-medium">{item.label}</p>
                            {item.detalle && (
                              <p className="text-[10px] text-muted-foreground">{item.detalle}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Actas CCA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {actas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin actas registradas.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {actas.map((a) => (
                    <div key={a.id} className="rounded border p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{a.tipo}</Badge>
                        <span className="font-medium">{a.titulo}</span>
                      </div>
                      {a.contenido && (
                        <p className="text-muted-foreground mt-1 line-clamp-2">{a.contenido}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(a.createdAt).toLocaleString("es-AR")}
                        {a.firmadoPor ? ` · ${a.firmadoPor}` : ""}
                        {a.firmadoCliente ? " · Firmado cliente" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 pt-2 border-t">
                <Select value={actaTipo} onValueChange={setActaTipo}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kickoff">Kick-off</SelectItem>
                    <SelectItem value="uat">UAT</SelectItem>
                    <SelectItem value="cierre">Cierre</SelectItem>
                    <SelectItem value="onboard_entrega">Entrega ONBOARD</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Título del acta"
                  value={actaTitulo}
                  onChange={(e) => setActaTitulo(e.target.value)}
                  className="h-8 text-xs"
                />
                <Textarea
                  placeholder="Contenido (opcional)"
                  value={actaContenido}
                  onChange={(e) => setActaContenido(e.target.value)}
                  className="min-h-[60px] text-xs"
                />
                <Button size="sm" className="w-full" onClick={crearActa} disabled={saving || !actaTitulo.trim()}>
                  Registrar acta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}