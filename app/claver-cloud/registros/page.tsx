"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  UserPlus,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import { cn } from "@/lib/utils"

type Row = {
  empresaId: number
  nombre: string
  email: string | null
  rubro: string
  modoLite: string
  createdAt: string
  diasDesdeAlta: number
  origenLabel: string
  origenDetalle: string | null
  demoIndustryId: string | null
  trial: { activo: boolean; diasRestantes: number; expirado: boolean } | null
  skusActivos: number
  mrrArs: number
  esDemoCompartida: boolean
  cuit: string
  usuarioPrincipal: { email: string } | null
}

type Resumen = {
  total: number
  enTrial: number
  registrosWeb7d: number
  demos7d: number
  trialsPorVencer: number
}

const FILTROS = [
  { id: "", label: "Todos" },
  { id: "web_register", label: "Registro web" },
  { id: "industry_demo", label: "Demo rubro" },
] as const

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function RegistrosWebPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [filtro, setFiltro] = useState("")
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const q = filtro ? `?origen=${filtro}` : ""
      const res = await fetch(`/api/claver/ops/registros-web${q}`, { headers: cloudAuthHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setRows(data.rows ?? [])
      setResumen(data.resumen ?? null)
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function extenderTrial(empresaId: number) {
    setActionId(empresaId)
    try {
      await fetch("/api/claver/ops/registros-web", {
        method: "PATCH",
        headers: cloudAuthHeaders(),
        body: JSON.stringify({ action: "extend_trial", empresaId, dias: 7 }),
      })
      await cargar()
    } finally {
      setActionId(null)
    }
  }

  async function impersonar(empresaId: number) {
    setActionId(empresaId)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/impersonate`, {
        method: "POST",
        headers: cloudAuthHeaders(),
      })
      const data = await res.json()
      if (data.token) {
        localStorage.setItem("token", data.token)
        window.open("/dashboard", "_blank")
      }
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <CloudPageHeader
        icon={UserPlus}
        eyebrow="Operaciones"
        title="Registros web y trials"
        description="Quién se registró, desde dónde, cuánto lleva probando y cuántos días de trial quedan. Todo atado al tenant."
        onRefresh={cargar}
        loading={loading}
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href="/claver-cloud">
              <ExternalLink className="h-4 w-4 mr-2" />
              Command Center
            </Link>
          </Button>
        }
      />

      {resumen && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {[
            { label: "En vista", value: resumen.total },
            { label: "En trial", value: resumen.enTrial },
            { label: "Registros web 7d", value: resumen.registrosWeb7d },
            { label: "Demos 7d", value: resumen.demos7d },
            { label: "Trial ≤3 días", value: resumen.trialsPorVencer, alert: resumen.trialsPorVencer > 0 },
          ].map((k) => (
            <Card key={k.label} className={cn(k.alert && "border-amber-500/40")}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-semibold tabular-nums">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {FILTROS.map((f) => (
          <Button
            key={f.id || "all"}
            size="sm"
            variant={filtro === f.id ? "default" : "outline"}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Sin registros en este filtro
            </CardContent>
          </Card>
        ) : (
          rows.map((r) => (
            <Card key={r.empresaId}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      #{r.empresaId} · {r.diasDesdeAlta}d activo
                    </p>
                  </div>
                  {r.trial?.activo ? (
                    <Badge className="bg-emerald-600 shrink-0">{r.trial.diasRestantes}d trial</Badge>
                  ) : r.trial?.expirado ? (
                    <Badge variant="destructive" className="shrink-0">
                      Vencido
                    </Badge>
                  ) : null}
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {r.origenLabel}
                </Badge>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/claver-cloud/tenants/${r.empresaId}`}>Tenant</Link>
                  </Button>
                  {r.trial && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionId === r.empresaId}
                      onClick={() => void extenderTrial(r.empresaId)}
                    >
                      +7d
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="hidden md:block">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Flota de altas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2">Tenant</th>
                  <th className="px-4 py-2">Origen</th>
                  <th className="px-4 py-2">Alta</th>
                  <th className="px-4 py-2">Trial</th>
                  <th className="px-4 py-2">Rubro / modo</th>
                  <th className="px-4 py-2">SKUs</th>
                  <th className="px-4 py-2 text-right">MRR</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      Sin registros en este filtro
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.empresaId} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        #{r.empresaId} · {r.usuarioPrincipal?.email ?? r.email ?? "—"}
                      </div>
                      {r.esDemoCompartida && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          Demo compartida
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{r.origenLabel}</Badge>
                      {r.demoIndustryId && (
                        <p className="text-xs text-muted-foreground mt-1">rubro: {r.demoIndustryId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {r.diasDesdeAlta}d
                      </div>
                      <div className="text-[11px] text-muted-foreground">{fmtFecha(r.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {!r.trial ? (
                        <span className="text-muted-foreground">—</span>
                      ) : r.trial.activo ? (
                        <Badge className="bg-emerald-600">{r.trial.diasRestantes}d rest.</Badge>
                      ) : (
                        <Badge variant="destructive">Vencido</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.rubro}
                      <br />
                      <span className="text-muted-foreground">{r.modoLite}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.skusActivos}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      {r.mrrArs > 0
                        ? new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            maximumFractionDigits: 0,
                          }).format(r.mrrArs)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/claver-cloud/tenants/${r.empresaId}`}>
                            <Building2 className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionId === r.empresaId}
                          onClick={() => void impersonar(r.empresaId)}
                          title="Ver como cliente"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        {r.trial && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={actionId === r.empresaId}
                            onClick={() => void extenderTrial(r.empresaId)}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            +7d
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}