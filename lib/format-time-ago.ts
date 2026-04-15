/**
 * formatTimeAgo — Relative time display ("hace 2 horas")
 * 
 * Every modern ERP/SaaS shows relative time with full date tooltip.
 * Used in: audit trails, notifications, facturas, caja, etc.
 */

const UNITS: [string, number][] = [
  ["año", 31536000],
  ["mes", 2592000],
  ["semana", 604800],
  ["día", 86400],
  ["hora", 3600],
  ["minuto", 60],
  ["segundo", 1],
]

const PLURALS: Record<string, string> = {
  año: "años",
  mes: "meses",
  semana: "semanas",
  día: "días",
  hora: "horas",
  minuto: "minutos",
  segundo: "segundos",
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()

  if (diffMs < 0) return "ahora"

  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 10) return "ahora"
  if (diffSec < 60) return "hace unos segundos"

  for (const [unit, seconds] of UNITS) {
    const count = Math.floor(diffSec / seconds)
    if (count >= 1) {
      const label = count === 1 ? unit : PLURALS[unit]
      return `hace ${count} ${label}`
    }
  }

  return "ahora"
}

export function formatAbsoluteDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
