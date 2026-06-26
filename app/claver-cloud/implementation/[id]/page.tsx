"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CalendarPlus, RefreshCw, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Stakeholder = { id: number; nombre: string; email: string }
type BacklogItem = {
  id: string
  titulo: string
  tipo: string
  estado: string
  visibilidadCliente: boolean
  sprintId?: string
}
type Sprint = { id: string; nombre: string; inicio: string; fin: string; activo: boolean }

const ESTADOS = ["backlog", "sprint", "en_curso", "review", "done"] as const

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

function enDosSemanasIso() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

export default function ClaverImplementationDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [items, setItems] = useState<BacklogItem[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [sprintNombre, setSprintNombre] = useState("")
  const [sprintInicio, setSprintInicio] = useState(hoyIso)
  const [sprintFin, setSprintFin] = useState(enDosSemanasIso)
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    if (!id) return
    const [sRes, bRes] = await Promise.all([
      fetch(`/api/claver/implementaciones/${id}/stakeholders`, { headers: authHeaders() }),
      fetch(`/api/claver/implementaciones/${id}/scrum`, { headers: authHeaders() }),
    ])
    if (sRes.ok) {
      const s = await sRes.json()
      setStakeholders(s.stakeholders ?? [])
    }
    if (bRes.ok) {
      const b = await bRes.json()
      setItems(b.items ?? [])
      setSprints(b.sprints ?? [])
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const invitar = async () => {
    setLoading(true)
    try {
      await fetch(`/api/claver/implementaciones/${id}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ nombre, email }),
      })
      setNombre("")
      setEmail("")
      await cargar()
    } finally {
      setLoading(false)
    }
  }

  const syncScrum = async () => {
    setLoading(true)
    try {
      await fetch(`/api/claver/implementaciones/${id}/scrum`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "sync" }),
      })
      await cargar()
    } finally {
      setLoading(false)
    }
  }

  const crearSprint = async () => {
    if (!sprintNombre.trim()) return
    setLoading(true)
    try {
      await fetch(`/api/claver/implementaciones/${id}/scrum`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          action: "create_sprint",
          nombre: sprintNombre.trim(),
          inicio: sprintInicio,
          fin: sprintFin,
        }),
      })
      setSprintNombre("")
      await cargar()
    } finally {
      setLoading(false)
    }
  }

  const mover = async (itemId: string, estado: string) => {
    await fetch(`/api/claver/implementaciones/${id}/scrum`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action: "move", itemId, estado }),
    })
    await cargar()
  }

  const asignarSprint = async (itemId: string, sprintId: string) => {
    await fetch(`/api/claver/implementaciones/${id}/scrum`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        action: "assign_sprint",
        itemId,
        sprintId: sprintId || null,
      }),
    })
    await cargar()
  }

  const sprintActivo = sprints.find((s) => s.activo)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/claver-cloud/implementation">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Proyecto #{id}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Stakeholders (portal cliente)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={invitar} disabled={loading || !nombre || !email}>
                Invitar
              </Button>
            </div>
          </div>
          <ul className="text-sm space-y-1">
            {stakeholders.map((s) => (
              <li key={s.id}>
                {s.nombre} — {s.email}
              </li>
            ))}
            {stakeholders.length === 0 && (
              <li className="text-muted-foreground">Sin stakeholders. El cliente accede en /claver-cliente</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            Sprints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sprintActivo && (
            <p className="text-sm">
              Activo: <span className="font-medium">{sprintActivo.nombre}</span>{" "}
              <span className="text-muted-foreground">
                ({sprintActivo.inicio} → {sprintActivo.fin})
              </span>
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label>Nombre</Label>
              <Input
                placeholder="Sprint 1"
                value={sprintNombre}
                onChange={(e) => setSprintNombre(e.target.value)}
              />
            </div>
            <div>
              <Label>Inicio</Label>
              <Input
                type="date"
                value={sprintInicio}
                onChange={(e) => setSprintInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Fin</Label>
              <Input type="date" value={sprintFin} onChange={(e) => setSprintFin(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                onClick={crearSprint}
                disabled={loading || !sprintNombre.trim() || !sprintInicio || !sprintFin}
              >
                Crear sprint
              </Button>
            </div>
          </div>
          {sprints.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {sprints.map((s) => (
                <li key={s.id}>
                  {s.nombre} ({s.inicio} → {s.fin}){s.activo ? " · activo" : ""}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tablero Scrum</CardTitle>
          <Button size="sm" variant="outline" disabled={loading} onClick={syncScrum}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Sincronizar desde CCA / marketplace / tickets
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-2 border rounded-md p-2 text-sm">
              <span className="font-medium flex-1 min-w-[140px]">{i.titulo}</span>
              <Badge variant="outline">{i.tipo}</Badge>
              <Badge variant="outline">{i.estado}</Badge>
              {sprints.length > 0 && (
                <select
                  className="text-xs border rounded px-2 py-1 bg-background"
                  value={i.sprintId ?? ""}
                  onChange={(e) => asignarSprint(i.id, e.target.value)}
                >
                  <option value="">Sin sprint</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="text-xs border rounded px-2 py-1 bg-background"
                value={i.estado}
                onChange={(e) => mover(i.id, e.target.value)}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin ítems. Usá Sincronizar para importar fases CCA y tareas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}