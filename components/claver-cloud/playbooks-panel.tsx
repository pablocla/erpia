"use client"

import { useEffect, useState } from "react"
import { Bot, Loader2, Play, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Playbook = {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  riesgo: string
  duracionEstimada: string
}

type StepResult = { paso: string; ok: boolean; detalle?: string; error?: string }

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

function riesgoColor(r: string) {
  if (r === "alto") return "bg-red-500/10 text-red-700 border-red-300"
  if (r === "medio") return "bg-amber-500/10 text-amber-800 border-amber-300"
  return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
}

export function PlaybooksPanel({ empresaId }: { empresaId: number }) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [running, setRunning] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ nombre: string; steps: StepResult[]; ok: boolean } | null>(null)

  useEffect(() => {
    fetch(`/api/claver/tenants/${empresaId}/playbooks`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { playbooks: [] }))
      .then((d) => setPlaybooks(d.playbooks ?? []))
  }, [empresaId])

  const ejecutar = async (playbookId: string) => {
    setRunning(playbookId)
    setLastResult(null)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/playbooks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ playbookId }),
      })
      if (res.ok) {
        const d = await res.json()
        setLastResult({ nombre: d.playbook?.nombre ?? playbookId, steps: d.steps ?? [], ok: d.ok })
      }
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4 text-primary" />
        Servicio <strong className="text-foreground">ops.playbooks_auto</strong> — ejecuciones automáticas con un clic
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {playbooks.map((p) => (
          <Card key={p.id} className="border-border/70">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex flex-wrap items-center gap-2">
                <Bot className="h-4 w-4" />
                {p.nombre}
                <Badge variant="outline" className={cn("text-[10px]", riesgoColor(p.riesgo))}>
                  {p.riesgo}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              <p className="text-xs text-muted-foreground">{p.descripcion}</p>
              <p className="text-[10px] text-muted-foreground">
                {p.categoria} · ~{p.duracionEstimada}
              </p>
              <Button
                size="sm"
                className="w-full"
                disabled={running === p.id}
                onClick={() => void ejecutar(p.id)}
              >
                {running === p.id ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Ejecutar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
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