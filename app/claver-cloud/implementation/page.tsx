"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  CalendarClock,
  ClipboardList,
  Plus,
  RefreshCw,
  Target,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CCA_FASES } from "@/lib/ops/implementacion-types"

type ProyectoRow = {
  id: number
  codigo: string
  estado: string
  faseActual: string
  porcentajeAvance: number
  planComercial: string | null
  analistaEmail: string | null
  fechaObjetivoGoLive: string | null
  packOnboardEntregado: boolean
  empresa: { id: number; nombre: string; razonSocial: string; rubro: string }
}

type Metricas = {
  activos: number
  atrasados: number
  sinPackOnboard: number
  avancePromedio: number
}

type EmpresaFlota = { id: number; nombre: string }

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function faseLabel(codigo: string) {
  return CCA_FASES.find((f) => f.codigo === codigo)?.nombre ?? codigo
}

function faseColor(codigo: string) {
  if (codigo === "CCA-070" || codigo === "CCA-080") return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
  if (codigo === "CCA-030" || codigo === "CCA-040") return "bg-blue-500/10 text-blue-700 border-blue-300"
  return "bg-amber-500/10 text-amber-800 border-amber-300"
}

export default function ClaverImplementationPage() {
  const [proyectos, setProyectos] = useState<ProyectoRow[]>([])
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [empresas, setEmpresas] = useState<EmpresaFlota[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState("activo")
  const [open, setOpen] = useState(false)
  const [empresaId, setEmpresaId] = useState("")
  const [plan, setPlan] = useState("Pro")
  const [goLive, setGoLive] = useState("")

  const cargar = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== "todos") params.set("estado", filtroEstado)

      const [res, metRes, cliRes] = await Promise.all([
        fetch(`/api/claver/implementaciones?${params}`, { headers: authHeaders() }),
        fetch("/api/claver/implementaciones?metricas=1", { headers: authHeaders() }),
        fetch("/api/claver/ops/clientes", { headers: authHeaders() }),
      ])

      if (res.ok) {
        const data = await res.json()
        setProyectos(Array.isArray(data.data) ? data.data : [])
      }
      if (metRes.ok) {
        const met = await metRes.json()
        setMetricas(met.metricas ?? null)
      }
      if (cliRes.ok) {
        const cli = await cliRes.json()
        setEmpresas(cli.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [filtroEstado])

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!empresaId) return
    const body: Record<string, string> = {
      empresaId,
      planComercial: plan,
    }
    if (goLive) body.fechaObjetivoGoLive = new Date(goLive).toISOString()

    const res = await fetch("/api/claver/implementaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setOpen(false)
      setEmpresaId("")
      setGoLive("")
      void cargar()
    } else {
      const err = await res.json()
      alert(err.error ?? "Error al crear proyecto")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Implementation Hub</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Professional Services & CCA Tracking
            <Badge variant="outline" className="bg-violet-500/10 text-violet-800 border-violet-300">
              CCA Methodology
            </Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Iniciar implementación (CCA-010)</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrear} className="space-y-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={empresaId} onValueChange={setEmpresaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan comercial</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha objetivo go-live</Label>
                  <Input type="date" value={goLive} onChange={(e) => setGoLive(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Crear proyecto</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {metricas && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.activos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delayed</CardTitle>
              <CalendarClock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{metricas.atrasados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing ONBOARD</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.sinPackOnboard}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <Target className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.avancePromedio}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        {["activo", "pausado", "completado", "todos"].map((e) => (
          <Button
            key={e}
            size="sm"
            variant={filtroEstado === e ? "default" : "outline"}
            onClick={() => setFiltroEstado(e)}
          >
            {e.charAt(0).toUpperCase() + e.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {proyectos.map((p) => {
          const atrasado =
            p.fechaObjetivoGoLive &&
            new Date(p.fechaObjetivoGoLive) < new Date() &&
            p.estado === "activo" &&
            p.faseActual !== "CCA-080"

          return (
            <Card key={p.id} className={atrasado ? "border-amber-400/60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.empresa.nombre}</CardTitle>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {p.codigo}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.empresa.razonSocial} · {p.empresa.rubro}
                  {p.planComercial ? ` · ${p.planComercial}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className={faseColor(p.faseActual)}>
                    {p.faseActual}: {faseLabel(p.faseActual)}
                  </Badge>
                  {atrasado && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">
                      Atrasado
                    </Badge>
                  )}
                  {!p.packOnboardEntregado && (
                    <Badge variant="outline" className="text-[10px]">
                      Sin ONBOARD
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="font-medium">{p.porcentajeAvance}%</span>
                  </div>
                  <Progress value={p.porcentajeAvance} className="h-2" />
                </div>
                {p.fechaObjetivoGoLive && (
                  <p className="text-xs text-muted-foreground">
                    Go-live objetivo:{" "}
                    {new Date(p.fechaObjetivoGoLive).toLocaleDateString("es-AR")}
                  </p>
                )}
                <Button asChild className="w-full" size="sm">
                  <Link href={`/claver-cloud/implementation/${p.id}`}>
                    Ver seguimiento CCA
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {proyectos.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No projects found. Create one from a tenant in your fleet.
        </p>
      )}
    </div>
  )
}
