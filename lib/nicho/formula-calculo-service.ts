/**
 * Sprint 4 — Motor de fórmulas técnicas (Math.js) por tenant.
 */

import { create, all } from "mathjs"
import { prisma } from "@/lib/prisma"

const math = create(all, {})

export const FORMULAS_SEED = [
  {
    codigo: "caudal_hazen",
    nombre: "Caudal tubería (Hazen-Williams simplificado)",
    expresion: "0.278 * C * D^2.63 * S^0.54",
    variables: ["C", "D", "S"],
    rubro: "plomeria",
  },
  {
    codigo: "superficie_pared",
    nombre: "Superficie pared (largo × alto)",
    expresion: "largo * alto",
    variables: ["largo", "alto"],
    rubro: "obra",
  },
] as const

export type EvaluarFormulaInput = {
  expresion: string
  valores: Record<string, number>
}

export function evaluarExpresion({ expresion, valores }: EvaluarFormulaInput): number {
  const scope: Record<string, number> = {}
  for (const [k, v] of Object.entries(valores)) {
    scope[k] = v
  }
  const result = math.evaluate(expresion, scope)
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("La expresión no devolvió un número válido")
  }
  return Math.round(result * 100) / 100
}

function db() {
  return prisma as any
}

export async function listFormulas(empresaId: number) {
  try {
    return await db().formulaCalculo.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    })
  } catch {
    return FORMULAS_SEED.map((f) => ({ ...f, id: 0, empresaId, activo: true }))
  }
}

export async function seedFormulasEmpresa(empresaId: number) {
  try {
    for (const f of FORMULAS_SEED) {
      await db().formulaCalculo.upsert({
        where: { empresaId_codigo: { empresaId, codigo: f.codigo } },
        create: {
          empresaId,
          codigo: f.codigo,
          nombre: f.nombre,
          expresion: f.expresion,
          variables: f.variables,
          rubro: f.rubro,
        },
        update: {},
      })
    }
  } catch {
    /* tabla aún no migrada */
  }
}

export async function evaluarFormulaPorCodigo(
  empresaId: number,
  codigo: string,
  valores: Record<string, number>,
): Promise<{ resultado: number; nombre: string }> {
  try {
    const row = await db().formulaCalculo.findUnique({
      where: { empresaId_codigo: { empresaId, codigo } },
    })
    if (row) {
      return {
        resultado: evaluarExpresion({ expresion: row.expresion, valores }),
        nombre: row.nombre,
      }
    }
  } catch {
    /* fallback seed */
  }

  const seed = FORMULAS_SEED.find((f) => f.codigo === codigo)
  if (!seed) throw new Error(`Fórmula no encontrada: ${codigo}`)
  return {
    resultado: evaluarExpresion({ expresion: seed.expresion, valores }),
    nombre: seed.nombre,
  }
}