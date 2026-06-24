export const CCA_FASES = [
  { codigo: "CCA-010", nombre: "Venta y contratación", peso: 5, orden: 1 },
  { codigo: "CCA-020", nombre: "Handoff comercial", peso: 5, orden: 2 },
  { codigo: "CCA-030", nombre: "Aprovisionamiento Cloud", peso: 15, orden: 3 },
  { codigo: "CCA-040", nombre: "Parametrización funcional", peso: 25, orden: 4 },
  { codigo: "CCA-050", nombre: "Integraciones y canales", peso: 15, orden: 5 },
  { codigo: "CCA-060", nombre: "UAT y capacitación", peso: 15, orden: 6 },
  { codigo: "CCA-070", nombre: "Go-Live", peso: 15, orden: 7 },
  { codigo: "CCA-080", nombre: "Cierre e hipercare", peso: 5, orden: 8 },
] as const

export type CcaFaseCodigo = (typeof CCA_FASES)[number]["codigo"]

export type FaseEstado = {
  completado: boolean
  fecha?: string | null
  notas?: string | null
  auto?: boolean
}

export type FasesMap = Partial<Record<CcaFaseCodigo, FaseEstado>>

export const CCA_FASE_CODIGOS = CCA_FASES.map((f) => f.codigo)

export function buildFasesIniciales(): FasesMap {
  const fases: FasesMap = {}
  for (const f of CCA_FASES) {
    fases[f.codigo] = { completado: false, fecha: null, notas: null }
  }
  return fases
}

export function calcularPorcentajeAvance(fases: FasesMap): number {
  let total = 0
  for (const f of CCA_FASES) {
    if (fases[f.codigo]?.completado) total += f.peso
  }
  return Math.min(100, total)
}

export function resolverFaseActual(fases: FasesMap): CcaFaseCodigo {
  for (const f of CCA_FASES) {
    if (!fases[f.codigo]?.completado) return f.codigo
  }
  return "CCA-080"
}

export function generarCodigoProyecto(empresaId: number, year = new Date().getFullYear()): string {
  const padded = String(empresaId).padStart(5, "0")
  return `IMP-${year}-${padded}`
}