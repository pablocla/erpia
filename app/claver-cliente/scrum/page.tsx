"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLS = [
  { key: "backlog", label: "Backlog" },
  { key: "sprint", label: "Sprint" },
  { key: "en_curso", label: "En curso" },
  { key: "review", label: "Revisión" },
  { key: "done", label: "Listo" },
] as const

type Item = {
  id: string
  titulo: string
  tipo: string
  estado: string
  asignadoA?: string
  sprintId?: string
}

type SprintActivo = {
  id: string
  nombre: string
  inicio: string
  fin: string
  activo: boolean
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function fmtFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-AR")
  } catch {
    return iso
  }
}

export default function ClaverClienteScrumPage() {
  const [items, setItems] = useState<Item[]>([])
  const [sprintActivo, setSprintActivo] = useState<SprintActivo | null>(null)

  useEffect(() => {
    fetch("/api/claver-cliente/scrum", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { items: [], sprintActivo: null }))
      .then((d) => {
        setItems(d.items ?? [])
        setSprintActivo(d.sprintActivo ?? null)
      })
  }, [])

  const itemsSprint =
    sprintActivo != null
      ? items.filter((i) => i.sprintId === sprintActivo.id || i.estado === "sprint")
      : []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Servicios y entregables</h1>
      <p className="text-sm text-muted-foreground">
        Vista de solo lectura del tablero acordado con tu analista (ERP y servicios adicionales).
      </p>

      {sprintActivo && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              Sprint activo: {sprintActivo.nombre}
              <Badge variant="secondary" className="text-xs font-normal">
                {fmtFecha(sprintActivo.inicio)} — {fmtFecha(sprintActivo.fin)}
              </Badge>
            </CardTitle>
          </CardHeader>
          {itemsSprint.length > 0 && (
            <CardContent className="px-4 pb-3 pt-0">
              <p className="text-xs text-muted-foreground mb-2">
                {itemsSprint.length} ítem{itemsSprint.length !== 1 ? "s" : ""} en este sprint
              </p>
              <ul className="text-sm space-y-1">
                {itemsSprint.map((i) => (
                  <li key={i.id} className="flex items-center gap-2">
                    <span className="flex-1">{i.titulo}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {i.estado}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-5">
        {COLS.map((col) => (
          <Card key={col.key} className="min-h-[120px]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">{col.label}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {items
                .filter((i) => i.estado === col.key)
                .map((i) => (
                  <div key={i.id} className="border rounded-md p-2 text-xs">
                    <p className="font-medium leading-snug">{i.titulo}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {i.tipo}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}