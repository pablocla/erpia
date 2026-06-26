"use client"

import { useEffect, useState } from "react"
import { Loader2, Play, Plus, Trash2, Wand2 } from "lucide-react"
import { ANALYST_PLAYBOOKS } from "@/lib/ops/analyst-playbooks-catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CustomPb = {
  id: string
  nombre: string
  descripcion?: string
  acciones: { tipo: string; action?: string; sku?: string; packId?: string; playbookId?: string }[]
  createdAt: string
  createdBy: string
}

type StepResult = { paso: string; ok: boolean; detalle?: string; error?: string }

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

export function CustomPlaybooksEditor({
  empresaId,
  planAllowsCustom,
}: {
  empresaId: number
  planAllowsCustom: boolean
}) {
  const [playbooks, setPlaybooks] = useState<CustomPb[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ nombre: string; steps: StepResult[]; ok: boolean } | null>(null)
  const [nombre, setNombre] = useState("")
  const [builtinId, setBuiltinId] = useState(ANALYST_PLAYBOOKS[0]?.id ?? "")

  const cargar = async () => {
    const res = await fetch(`/api/claver/tenants/${empresaId}/playbooks/custom`, { headers: authHeaders() })
    if (res.ok) {
      const d = await res.json()
      setPlaybooks(d.playbooks ?? [])
    }
  }

  useEffect(() => {
    if (planAllowsCustom) void cargar()
  }, [empresaId, planAllowsCustom])

  const crear = async () => {
    if (!nombre.trim() || !builtinId) return
    setBusy("create")
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/playbooks/custom`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          nombre: nombre.trim(),
          acciones: [{ tipo: "playbook_builtin", playbookId: builtinId }],
        }),
      })
      if (res.ok) {
        setNombre("")
        await cargar()
      }
    } finally {
      setBusy(null)
    }
  }

  const ejecutar = async (playbookId: string) => {
    setBusy(playbookId)
    setLastResult(null)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/playbooks/custom`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ playbookId }),
      })
      if (res.ok) {
        const d = await res.json()
        setLastResult({ nombre: d.playbook?.nombre ?? playbookId, steps: d.steps ?? [], ok: d.ok })
      }
    } finally {
      setBusy(null)
    }
  }

  const eliminar = async (playbookId: string) => {
    setBusy(`del-${playbookId}`)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/playbooks/custom?playbookId=${playbookId}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (res.ok) await cargar()
    } finally {
      setBusy(null)
    }
  }

  if (!planAllowsCustom) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Playbooks personalizados disponibles en plan <strong className="text-foreground">Enterprise</strong>.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wand2 className="h-4 w-4 text-primary" />
        Playbooks custom — combina pasos builtin y acciones de producto (Enterprise)
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Nuevo playbook</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[160px]">
            <Label className="text-xs">Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Onboarding almacén" />
          </div>
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-xs">Primer paso (builtin)</Label>
            <Select value={builtinId} onValueChange={setBuiltinId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANALYST_PLAYBOOKS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" disabled={busy === "create"} onClick={() => void crear()}>
            {busy === "create" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
            Crear
          </Button>
        </CardContent>
      </Card>

      {playbooks.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin playbooks custom aún.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {playbooks.map((pb) => (
            <Card key={pb.id}>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  {pb.nombre}
                  <Badge variant="outline" className="text-[10px] font-mono">{pb.acciones.length} pasos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <p className="text-[10px] text-muted-foreground">
                  {pb.createdBy} · {new Date(pb.createdAt).toLocaleDateString("es-AR")}
                </p>
                <div className="flex gap-1">
                  <Button size="sm" className="flex-1" disabled={busy === pb.id} onClick={() => void ejecutar(pb.id)}>
                    {busy === pb.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                    Ejecutar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === `del-${pb.id}`}
                    onClick={() => void eliminar(pb.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {lastResult && (
        <Card className={lastResult.ok ? "border-emerald-300/50" : "border-red-300/50"}>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm">Resultado: {lastResult.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-xs space-y-1">
            {lastResult.steps.map((s, i) => (
              <p key={i} className={s.ok ? "text-foreground" : "text-destructive"}>
                {s.ok ? "✓" : "✗"} {s.paso}
                {s.detalle && ` — ${s.detalle}`}
                {s.error && ` — ${s.error}`}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}