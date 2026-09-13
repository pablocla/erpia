"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, RefreshCw, Sun, Users } from "lucide-react"
import { WORKS_STATUS_LABEL } from "@/lib/works/fsm"

type ProjectRow = {
  id: string
  segmento: string
  status: keyof typeof WORKS_STATUS_LABEL
  titulo: string
  senaPagada: boolean
  partner?: { empresa: string } | null
  lead?: { nombre: string; email?: string | null; zona?: string | null } | null
  updatedAt: string
}

export default function WorksBandejaPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [segmento, setSegmento] = useState("energy")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [nombre, setNombre] = useState("")
  const [zona, setZona] = useState("")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams()
      if (segmento) qs.set("segmento", segmento)
      if (status) qs.set("status", status)
      const res = await authFetch(`/api/works/projects?${qs}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setProjects(data.projects ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [segmento, status])

  useEffect(() => {
    void load()
  }, [load])

  async function createManual() {
    if (!nombre.trim()) return
    setBusy(true)
    try {
      const res = await authFetch("/api/works/leads", {
        method: "POST",
        body: JSON.stringify({
          segmento,
          fuente: "manual",
          nombre,
          email: email || undefined,
          zona: zona || undefined,
          payload: { notas: "alta manual Cloud" },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setShowNew(false)
      setNombre("")
      setZona("")
      setEmail("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sun className="h-6 w-6 text-amber-400" /> Works
          </h1>
          <p className="text-sm text-muted-foreground">
            Bandeja multi-segmento · FSM Lead→Cobrado · PRD CLAVER_WORKS_ENGINE
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/claver-cloud/works/partners">
              <Users className="mr-1.5 h-4 w-4" /> Partners
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowNew((v) => !v)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nuevo lead
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label>Segmento</Label>
          <select
            className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={segmento}
            onChange={(e) => setSegmento(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="energy">energy</option>
            <option value="infra">infra</option>
            <option value="blockchain">blockchain</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Estado</Label>
          <select
            className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.keys(WORKS_STATUS_LABEL).map((s) => (
              <option key={s} value={s}>
                {WORKS_STATUS_LABEL[s as keyof typeof WORKS_STATUS_LABEL]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showNew ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alta manual / WA</CardTitle>
            <CardDescription>Crea WorksLead + Project estado Lead</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Zona" value={zona} onChange={(e) => setZona(e.target.value)} />
            <Button disabled={busy || !nombre.trim()} onClick={() => void createManual()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Sin proyectos. Probá el form público /energy o creá un lead manual.
              </CardContent>
            </Card>
          ) : (
            projects.map((p) => (
              <Link key={p.id} href={`/claver-cloud/works/${p.id}`}>
                <Card className="hover:border-violet-500/40 transition">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <div className="font-medium">{p.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.lead?.nombre ?? "—"} · {p.lead?.zona ?? "sin zona"} · {p.segmento}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.senaPagada ? <Badge className="bg-emerald-600">Seña</Badge> : null}
                      {p.partner ? <Badge variant="outline">{p.partner.empresa}</Badge> : null}
                      <Badge variant="secondary">{WORKS_STATUS_LABEL[p.status] ?? p.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
