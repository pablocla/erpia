/** Productos que se venden por kg, litro o metro — abren numpad de peso/cantidad en POS */

const UNIDADES_VARIABLES = new Set([
  "kg",
  "kilogramo",
  "kilogramos",
  "g",
  "gramo",
  "gramos",
  "litro",
  "litros",
  "l",
  "metro",
  "metros",
  "m",
])

export function productoRequiereCantidadVariable(unidad?: string | null): boolean {
  if (!unidad) return false
  return UNIDADES_VARIABLES.has(unidad.trim().toLowerCase())
}

export function etiquetaUnidadVariable(unidad?: string | null): string {
  const u = (unidad ?? "kg").toLowerCase()
  if (u === "l" || u.startsWith("litro")) return "litros"
  if (u === "m" || u.startsWith("metro")) return "metros"
  return "kg"
}