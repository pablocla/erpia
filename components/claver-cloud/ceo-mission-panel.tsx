"use client"

import Link from "next/link"
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Circle,
  ExternalLink,
  ListTodo,
  Megaphone,
  Target,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import type { CeoFaseId } from "@/lib/ops/ceo-roadmap-catalog"
import { cn } from "@/lib/utils"

type FocoItem = {
  id: string
  titulo: string
  descripcion: string
  tipo: string
  href?: string
  codigoTarea?: string
}

type Alert = {
  id: string
  severidad: "critica" | "advertencia" | "info" | "exito"
  titulo: string
  mensaje: string
  accion?: string
  href?: string
}

type Tarea = {
  codigo: string
  fase: CeoFaseId
  titulo: string
  descripcion: string
  categoria: string
  prioridad: string
  href?: string
  completada: boolean
  bloqueada: boolean
  bloqueadaRazon: string | null
  disponible: boolean
  diferida?: boolean
  estimadoMin?: number
}

type FaseProgreso = {
  id: CeoFaseId
  nombre: string
  objetivo: string
  total: number
  hechas: number
  porcentaje: number
}

type MandoData = {
  focoHoy: FocoItem[]
  alerts: Alert[]
  roadmap: {
    faseActual: CeoFaseId
    fases: FaseProgreso[]
    tareas: Tarea[]
    pendientes: Tarea[]
    completadas: number
    total: number
  }
  rutinaDiaria: readonly { id: string; texto: string }[]
  metasF1: {
    visitasMes: number
    visitasSemana: number
    visitasDia: number
    conversiones: number
    progreso: { visitasSemana: number; trials: number; conversiones: number }
  }
}

const alertStyles: Record<Alert["severidad"], string> = {
  critica: "border-red-500/40 bg-red-500/10",
  advertencia: "border-amber-500/40 bg-amber-500/10",
  info: "border-blue-500/40 bg-blue-500/5",
  exito: "border-emerald-500/40 bg-emerald-500/10",
}

const faseActualLabel: Record<CeoFaseId, string> = {
  f0: "Setup",
  f1: "Primer cliente",
  f2: "Bundle",
  f3: "Escala",
  mkt: "Marketing",
}

type Props = {
  mando: MandoData
  onRefresh: () => void
}

export function CeoMissionPanel({ mando, onRefresh }: Props) {
  const { focoHoy, alerts, roadmap, rutinaDiaria, metasF1 } = mando
  const faseActualInfo = roadmap.fases.find((f) => f.id === roadmap.faseActual)

  async function toggleTarea(codigo: string, completada: boolean) {
    const res = await fetch("/api/claver/ceo/tareas", {
      method: "PATCH",
      headers: cloudAuthHeaders(true),
      body: JSON.stringify({ codigo, completada }),
    })
    if (res.ok) onRefresh()
  }

  const tareasFaseActual = roadmap.tareas.filter((t) => t.fase === roadmap.faseActual)
  const tareasDiferidas = roadmap.tareas.filter((t) => t.diferida)

  return (
    <div className="space-y-6">
      {/* Foco hoy */}
      <Card className="border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-400" />
            Tu foco hoy
            <Badge variant="outline" className="ml-auto bg-violet-500/10 text-violet-300 border-violet-500/30">
              Fase {faseActualLabel[roadmap.faseActual]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {focoHoy.length === 0 ? (
            <p className="text-sm text-muted-foreground">Completaste el foco del día. Revisá alertas o salí a visitar.</p>
          ) : (
            focoHoy.map((item, i) => (
              <div key={item.id} className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.descripcion}</p>
                  {item.href && (
                    <Link href={item.href} className="text-xs text-violet-400 hover:underline mt-1 inline-flex items-center gap-1">
                      Ir <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {item.codigoTarea && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs mt-1 px-2"
                      onClick={() => void toggleTarea(item.codigoTarea!, true)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Marcar hecho
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alertas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas críticas.</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className={cn("rounded-lg border p-3 text-sm", alertStyles[a.severidad])}>
                  <p className="font-medium">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.mensaje}</p>
                  {a.href && (
                    <Link href={a.href} className="text-xs text-violet-400 hover:underline mt-1 inline-block">
                      {a.accion ?? "Ver más"}
                    </Link>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Metas Fase 1 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Metas comerciales (Fase 1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Visitas esta semana", actual: metasF1.progreso.visitasSemana, meta: metasF1.visitasSemana },
              { label: "Trials activos", actual: metasF1.progreso.trials, meta: 8 },
              { label: "Clientes pagos", actual: metasF1.progreso.conversiones, meta: metasF1.conversiones },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{m.label}</span>
                  <span className="text-muted-foreground">
                    {m.actual} / {m.meta}
                  </span>
                </div>
                <Progress value={Math.min(100, (m.actual / m.meta) * 100)} className="h-2" />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Ritmo diario objetivo: {metasF1.visitasDia} visitas · {metasF1.visitasMes} visitas/mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap fases */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Roadmap CEO</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          {roadmap.fases
            .filter((f) => f.id !== "mkt")
            .map((f) => (
              <div
                key={f.id}
                className={cn(
                  "rounded-lg border p-3",
                  f.id === roadmap.faseActual && "border-violet-500/50 bg-violet-500/5",
                )}
              >
                <p className="text-xs text-muted-foreground">{f.nombre}</p>
                <p className="text-lg font-bold mt-1">{f.porcentaje}%</p>
                <Progress value={f.porcentaje} className="h-1.5 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {f.hechas}/{f.total} tareas
                </p>
              </div>
            ))}
        </div>

        {/* Tareas fase actual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Tareas — {faseActualInfo?.nombre ?? roadmap.faseActual}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{faseActualInfo?.objetivo}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {tareasFaseActual.map((t) => (
              <TareaRow key={t.codigo} tarea={t} onToggle={toggleTarea} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Rutina diaria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rutina diaria (5 min planificación)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {rutinaDiaria.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <Circle className="h-3 w-3 text-violet-400 shrink-0" />
                {r.texto}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Marketing diferido */}
      <Card className="border-dashed opacity-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
            <Ban className="h-4 w-4" />
            No hacer todavía
            <Megaphone className="h-4 w-4 ml-1" />
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Redes, ads y SEO están bloqueados hasta tener venta repetible (3+ clientes pagos).
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {tareasDiferidas.map((t) => (
            <div key={t.codigo} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Ban className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p>{t.titulo}</p>
                <p className="text-xs">{t.bloqueadaRazon}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TareaRow({
  tarea,
  onToggle,
}: {
  tarea: Tarea
  onToggle: (codigo: string, completada: boolean) => void
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3",
        tarea.completada && "opacity-60",
        tarea.bloqueada && !tarea.completada && "opacity-50",
      )}
    >
      <Checkbox
        checked={tarea.completada}
        disabled={tarea.bloqueada && !tarea.completada}
        onCheckedChange={(v) => onToggle(tarea.codigo, v === true)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-sm font-medium", tarea.completada && "line-through")}>{tarea.titulo}</p>
          {tarea.prioridad === "critica" && !tarea.completada && (
            <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
              Crítica
            </Badge>
          )}
          {tarea.estimadoMin && (
            <span className="text-xs text-muted-foreground">~{tarea.estimadoMin} min</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{tarea.descripcion}</p>
        {tarea.bloqueadaRazon && !tarea.completada && (
          <p className="text-xs text-amber-500/90 mt-1">{tarea.bloqueadaRazon}</p>
        )}
        {tarea.href && !tarea.completada && (
          <Link href={tarea.href} className="text-xs text-violet-400 hover:underline mt-1 inline-flex items-center gap-1">
            Abrir recurso <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

