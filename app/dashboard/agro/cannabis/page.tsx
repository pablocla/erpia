"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { PageShell, PageHeader, KpiStrip } from "@/components/layout"
import {
  Leaf, FlaskConical, Sprout, DollarSign, ShieldCheck,
  ArrowUpRight, Beaker, Layers, AlertTriangle,
} from "lucide-react"

interface Perfil {
  nombreOng: string | null
  reprocannNumero: string | null
  reprocannVencimiento: string | null
  cupoPlantas: number | null
  cupoSuperficieM2: number | null
  responsableTecnico: string | null
}

interface DashboardData {
  perfil: Perfil | null
  ciclosActivos: number
  plantasActivas: number
  cupoPlantas: number | null
  cupoPct: number | null
  insumosBajoStock: number
  costoMes: number
  costosPorCategoria: Record<string, number>
  aplicacionesRecientes: Array<{
    id: number
    fecha: string
    cantidad: number
    unidad: string
    costoTotal: number
    insumo: { nombre: string; categoria: string }
    ciclo: { numero: string; sala: { nombre: string } }
  }>
  analisisRecientes: Array<{
    id: number
    fecha: string
    ph: number | null
    ec: number | null
    tipoMuestra: string
    sala: { nombre: string } | null
    ciclo: { numero: string } | null
  }>
}

const ARS = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)

const CATEGORIA_LABEL: Record<string, string> = {
  FERTILIZANTE: "Fertilizantes",
  QUIMICO: "Químicos",
  SUSTRATO: "Sustrato / tierra",
  SEMILLA: "Semillas",
  NUTRIENTE: "Nutrientes",
  OTRO: "Otros",
}

export default function CannabisDashboardPage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useAuthFetch<DashboardData>("/api/agro/cannabis/dashboard")
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [perfilForm, setPerfilForm] = useState({
    nombreOng: "",
    reprocannNumero: "",
    reprocannVencimiento: "",
    cupoPlantas: "",
    cupoSuperficieM2: "",
    responsableTecnico: "",
  })

  function openPerfil() {
    setPerfilForm({
      nombreOng: data?.perfil?.nombreOng ?? "",
      reprocannNumero: data?.perfil?.reprocannNumero ?? "",
      reprocannVencimiento: data?.perfil?.reprocannVencimiento
        ? new Date(data.perfil.reprocannVencimiento).toISOString().slice(0, 10)
        : "",
      cupoPlantas: data?.perfil?.cupoPlantas != null ? String(data.perfil.cupoPlantas) : "",
      cupoSuperficieM2: data?.perfil?.cupoSuperficieM2 != null ? String(data.perfil.cupoSuperficieM2) : "",
      responsableTecnico: data?.perfil?.responsableTecnico ?? "",
    })
    setPerfilOpen(true)
  }

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/perfil", {
        method: "PUT",
        body: JSON.stringify({
          nombreOng: perfilForm.nombreOng || undefined,
          reprocannNumero: perfilForm.reprocannNumero || undefined,
          reprocannVencimiento: perfilForm.reprocannVencimiento || undefined,
          cupoPlantas: perfilForm.cupoPlantas ? Number(perfilForm.cupoPlantas) : undefined,
          cupoSuperficieM2: perfilForm.cupoSuperficieM2 ? Number(perfilForm.cupoSuperficieM2) : undefined,
          responsableTecnico: perfilForm.responsableTecnico || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setPerfilOpen(false)
      toast({ title: "Perfil ONG actualizado" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const kpiItems = [
    { label: "Ciclos activos", value: String(data?.ciclosActivos ?? 0), icon: Sprout },
    {
      label: "Plantas en cultivo",
      value: String(data?.plantasActivas ?? 0),
      hint: data?.cupoPct != null ? `${data.cupoPct}% del cupo REPROCANN` : undefined,
      icon: Leaf,
    },
    { label: "Costo insumos (mes)", value: ARS(data?.costoMes ?? 0), icon: DollarSign },
    {
      label: "Stock crítico",
      value: String(data?.insumosBajoStock ?? 0),
      hint: "insumos bajo mínimo",
      icon: AlertTriangle,
      iconClassName: (data?.insumosBajoStock ?? 0) > 0 ? "text-amber-500" : undefined,
    },
  ]

  const accesos = [
    { href: "/dashboard/agro/cannabis/ciclos", label: "Ciclos de cultivo", desc: "Germinación → cosecha", icon: Sprout },
    { href: "/dashboard/agro/cannabis/insumos", label: "Insumos y stock", desc: "Fertilizantes, químicos, sustrato", icon: FlaskConical },
    { href: "/dashboard/agro/cannabis/aplicaciones", label: "Aplicaciones", desc: "Registro de dosis y costos", icon: Beaker },
    { href: "/dashboard/agro/cannabis/suelo", label: "Suelo / sustrato", desc: "pH, EC, NPK, humedad", icon: Layers },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Cultivo regulado"
        description="Trazabilidad REPROCANN: ciclos, insumos, suelo, costos y cosecha."
        badge={
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {data?.perfil?.reprocannNumero ?? "Sin REPROCANN"}
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" onClick={openPerfil}>
            Configurar ONG
          </Button>
        }
      />

      <KpiStrip items={kpiItems} columns={4} />

      {/* Compliance REPROCANN */}
      <Card className="border-emerald-200/60 bg-emerald-50/30 dark:bg-emerald-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Cumplimiento y cupos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-muted-foreground">ONG</p>
            <p className="font-medium">{data?.perfil?.nombreOng ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Responsable técnico</p>
            <p className="font-medium">{data?.perfil?.responsableTecnico ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cupo plantas</p>
            <p className="font-medium">
              {data?.plantasActivas ?? 0}
              {data?.cupoPlantas != null ? ` / ${data.cupoPlantas}` : ""}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Superficie autorizada</p>
            <p className="font-medium">
              {data?.perfil?.cupoSuperficieM2 != null ? `${data.perfil.cupoSuperficieM2} m²` : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Costos por categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Costos del mes por categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data?.costosPorCategoria ?? {}).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin aplicaciones registradas este mes.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data?.costosPorCategoria ?? {}).map(([cat, monto]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span>{CATEGORIA_LABEL[cat] ?? cat}</span>
                    <span className="font-medium">{ARS(monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aplicaciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Últimas aplicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.aplicacionesRecientes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin aplicaciones registradas.</p>
            ) : (
              <div className="divide-y">
                {data?.aplicacionesRecientes.map((a) => (
                  <div key={a.id} className="py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{a.insumo.nombre}</span>
                      <span className="text-muted-foreground">{ARS(a.costoTotal)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.ciclo.numero} · {a.ciclo.sala.nombre} · {a.cantidad} {a.unidad}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análisis suelo recientes */}
      {(data?.analisisRecientes ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos análisis de suelo / sustrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data?.analisisRecientes.map((a) => (
                <div key={a.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{a.sala?.nombre ?? a.ciclo?.numero ?? "Muestra"}</p>
                  <p className="text-xs text-muted-foreground">{a.tipoMuestra}</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    {a.ph != null && <span>pH {a.ph}</span>}
                    {a.ec != null && <span>EC {a.ec}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accesos rápidos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {accesos.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <item.icon className="h-8 w-8 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Link>
        ))}
      </div>

      <Dialog open={perfilOpen} onOpenChange={setPerfilOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil ONG — REPROCANN</DialogTitle>
          </DialogHeader>
          <form onSubmit={guardarPerfil} className="space-y-3">
            <div>
              <Label>Nombre de la ONG</Label>
              <Input value={perfilForm.nombreOng} onChange={(e) => setPerfilForm((f) => ({ ...f, nombreOng: e.target.value }))} />
            </div>
            <div>
              <Label>Nº REPROCANN</Label>
              <Input className="font-mono" value={perfilForm.reprocannNumero} onChange={(e) => setPerfilForm((f) => ({ ...f, reprocannNumero: e.target.value }))} />
            </div>
            <div>
              <Label>Vencimiento REPROCANN</Label>
              <Input type="date" value={perfilForm.reprocannVencimiento} onChange={(e) => setPerfilForm((f) => ({ ...f, reprocannVencimiento: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cupo plantas</Label>
                <Input type="number" min="0" value={perfilForm.cupoPlantas} onChange={(e) => setPerfilForm((f) => ({ ...f, cupoPlantas: e.target.value }))} />
              </div>
              <div>
                <Label>Superficie (m²)</Label>
                <Input type="number" min="0" step="0.1" value={perfilForm.cupoSuperficieM2} onChange={(e) => setPerfilForm((f) => ({ ...f, cupoSuperficieM2: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Responsable técnico</Label>
              <Input value={perfilForm.responsableTecnico} onChange={(e) => setPerfilForm((f) => ({ ...f, responsableTecnico: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPerfilOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}