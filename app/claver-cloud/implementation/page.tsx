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
import { PageShell, PageHeader, KpiStrip, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type { StatusVariant } from "@/lib/ui/status-map"

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

function faseVariant(codigo: string): StatusVariant {
  if (codigo === "CCA-070" || codigo === "CCA-080") return "success"
  if (codigo === "CCA-030" || codigo === "CCA-040") return "info"
  return "warning"
}

const FILTRO_LABEL: Record<string, string> = {
  activo: "Activos",
  pausado: "Pausados",
  completado: "Completados",
  todos: "Todos",
}

export default function ClaverImplementationPage() {
  const [proyectos, setProyectos] = useState<ProyectoRow[]>([])
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [empresas, setEmpresas] = useState<EmpresaFlota[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("activo")
  const [open, setOpen] = useState(false)
  const [empresaId, setEmpresaId] = useState("")
  const [plan, setPlan] = useState("Pro")
  const [goLive, setGoLive] = useState("")
  const [q, setQ] = useState("")

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

  const proyectosFiltrados = proyectos.filter((p) => {
    const term = q.trim().toLowerCase()
    if (!term) return true
    const hay = [p.empresa.nombre, p.empresa.razonSocial, p.empresa.rubro, p.codigo, p.planComercial]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return hay.includes(term)
  })

  if (loading && proyectos.length === 0) {
    return <PageSkeleton kpis={4} tableRows={6} tableCols={3} />
  }

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Implementaciones CCA"
        description="Seguimiento de proyectos de implementación: fases, avance, go-live y pack ONBOARD."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ClipboardList className="h-3.5 w-3.5" />
            Professional Services
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="min-h-[40px]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo proyecto
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
                  <Button type="submit" className="w-full min-h-[40px]">
                    Crear proyecto
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => void cargar()} disabled={loading} className="min-h-[40px]">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        }
      />

      {metricas && (
        <KpiStrip
          columns={4}
          items={[
            { label: "Proyectos activos", value: metricas.activos, icon: ClipboardList },
            {
              label: "Atrasados",
              value: (
                <span className={metricas.atrasados > 0 ? "text-[var(--status-warning-foreground)]" : undefined}>
                  {metricas.atrasados}
                </span>
              ),
              icon: CalendarClock,
              iconClassName: metricas.atrasados > 0 ? "text-[var(--status-warning)]" : undefined,
            },
            { label: "Sin pack ONBOARD", value: metricas.sinPackOnboard, icon: Building2 },
            {
              label: "Avance promedio",
              value: `${metricas.avancePromedio}%`,
              icon: Target,
              iconClassName: "text-[var(--status-success)]",
            },
          ]}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(["activo", "pausado", "completado", "todos"] as const).map((e) => (
            <Button
              key={e}
              size="sm"
              variant={filtroEstado === e ? "default" : "outline"}
              onClick={() => setFiltroEstado(e)}
              className="min-h-[36px]"
            >
              {FILTRO_LABEL[e]}
            </Button>
          ))}
        </div>
        <Input
          className="sm:max-w-xs min-h-[40px]"
          placeholder="Buscar cliente, código o plan…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar implementaciones"
        />
      </div>

      {proyectosFiltrados.length === 0 && !loading ? (
        <EmptyState
          icon={ClipboardList}
          title={proyectos.length === 0 ? "Sin proyectos de implementación" : "Ningún proyecto coincide"}
          description={
            proyectos.length === 0
              ? "Creá un proyecto CCA para un tenant de la flota o abrí la ficha del tenant y seguí el onboarding."
              : "Probá otro filtro o limpiá la búsqueda."
          }
          actionLabel={proyectos.length === 0 ? "Nuevo proyecto" : "Limpiar búsqueda"}
          onAction={
            proyectos.length === 0
              ? () => setOpen(true)
              : () => {
                  setQ("")
                  setFiltroEstado("todos")
                }
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {proyectosFiltrados.map((p) => {
            const atrasado = Boolean(
              p.fechaObjetivoGoLive &&
                new Date(p.fechaObjetivoGoLive) < new Date() &&
                p.estado === "activo" &&
                p.faseActual !== "CCA-080",
            )

            return (
              <Card
                key={p.id}
                className={atrasado ? "border-[var(--status-warning-border)]" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.empresa.nombre}</CardTitle>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                      {p.codigo}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.empresa.razonSocial} · {p.empresa.rubro}
                    {p.planComercial ? ` · ${p.planComercial}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge
                      variant={faseVariant(p.faseActual)}
                      label={`${p.faseActual}: ${faseLabel(p.faseActual)}`}
                    />
                    {atrasado && <StatusBadge variant="error" label="Atrasado" />}
                    {!p.packOnboardEntregado && (
                      <StatusBadge variant="neutral" label="Sin ONBOARD" />
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
                  {p.analistaEmail && (
                    <p className="text-xs text-muted-foreground truncate">
                      Analista: {p.analistaEmail}
                    </p>
                  )}
                  <Button asChild className="w-full min-h-[40px]" size="sm">
                    <Link href={`/claver-cloud/implementation/${p.id}`}>
                      Ver seguimiento CCA
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
