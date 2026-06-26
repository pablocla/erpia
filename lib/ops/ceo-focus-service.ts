import { CEO_RUTINA_DIARIA } from "@/lib/ops/ceo-roadmap-catalog"
import type { CeoTareaEnriquecida } from "@/lib/ops/ceo-task-service"
import type { CeoAlert } from "@/lib/ops/ceo-alerts-service"

export type FocoHoyItem = {
  id: string
  titulo: string
  descripcion: string
  tipo: "tarea" | "alerta" | "rutina" | "comercial"
  href?: string
  codigoTarea?: string
}

export function computeFocoHoy(opts: {
  tareasPendientes: CeoTareaEnriquecida[]
  alerts: CeoAlert[]
  followupsVencidos: { id: number; nombre: string }[]
  clientesPagos: number
}): FocoHoyItem[] {
  const foco: FocoHoyItem[] = []
  const usados = new Set<string>()

  function push(item: FocoHoyItem) {
    if (foco.length >= 5 || usados.has(item.id)) return
    usados.add(item.id)
    foco.push(item)
  }

  for (const a of opts.alerts.filter((x) => x.severidad === "critica")) {
    push({
      id: `alert-${a.id}`,
      titulo: a.titulo,
      descripcion: a.mensaje,
      tipo: "alerta",
      href: a.href,
    })
  }

  for (const f of opts.followupsVencidos.slice(0, 2)) {
    push({
      id: `followup-${f.id}`,
      titulo: `WhatsApp: ${f.nombre}`,
      descripcion: "Follow-up vencido — contactar hoy",
      tipo: "comercial",
    })
  }

  for (const t of opts.tareasPendientes.filter((x) => x.prioridad === "critica").slice(0, 3)) {
    push({
      id: `tarea-${t.codigo}`,
      titulo: t.titulo,
      descripcion: t.descripcion,
      tipo: "tarea",
      href: t.href,
      codigoTarea: t.codigo,
    })
  }

  if (opts.clientesPagos === 0) {
    push({
      id: "rutina-visitas",
      titulo: CEO_RUTINA_DIARIA[0].texto,
      descripcion: "Venta boca a boca en zona piloto — sin ads",
      tipo: "rutina",
    })
  }

  for (const t of opts.tareasPendientes.filter((x) => x.prioridad === "alta").slice(0, 2)) {
    push({
      id: `tarea-${t.codigo}`,
      titulo: t.titulo,
      descripcion: t.descripcion,
      tipo: "tarea",
      href: t.href,
      codigoTarea: t.codigo,
    })
  }

  if (foco.length < 3) {
    push({
      id: "rutina-pipeline",
      titulo: CEO_RUTINA_DIARIA[1].texto,
      descripcion: "Cada prospecto en el kanban",
      tipo: "rutina",
    })
  }

  return foco.slice(0, 5)
}