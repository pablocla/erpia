import type { LabLeadItem } from "@/lib/lab/lab-types"

export function buildWaMessage(lead: Pick<LabLeadItem, "nombre" | "zona" | "productoTarget">, variant: "A" | "B" = "A"): string {
  const nombre = lead.nombre
  if (variant === "B") {
    return `Hola, ¿hablás con el dueño de ${nombre}? Soy de Claver. Varios locales de ${lead.zona} están ordenando ${lead.productoTarget} para dejar de perder plata en libreta/caja. ¿Tenés 10 minutos esta semana?`
  }
  return `Hola ${nombre}, te escribo de Claver. Te puedo mostrar ${lead.productoTarget} en 10 minutos — sin compromiso. ¿Cuándo te viene bien?`
}
