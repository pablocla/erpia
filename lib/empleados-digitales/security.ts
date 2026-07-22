/**
 * Guards multi-tenant para empleados digitales.
 * Regla: empresaId SIEMPRE del JWT / job scope — nunca del LLM ni del body sin validar.
 */

import { prisma } from "@/lib/prisma"
import { LEO_COBRANZA_SKU, LEO_LEGACY_SKU, type EmpleadoEstado } from "./types"

export class EmpleadoSecurityError extends Error {
  constructor(
    message: string,
    public status: number = 403,
    public code: string = "EMPLEADO_FORBIDDEN",
  ) {
    super(message)
    this.name = "EmpleadoSecurityError"
  }
}

/** Carga instancia y aborta si no pertenece a la empresa */
export async function loadEmpleadoScoped(empresaId: number, empleadoId: number) {
  const emp = await prisma.empleadoDigital.findFirst({
    where: { id: empleadoId, empresaId },
    include: { template: true },
  })
  if (!emp) {
    throw new EmpleadoSecurityError("Empleado digital no encontrado", 404, "EMPLEADO_NOT_FOUND")
  }
  return emp
}

export async function loadEmpleadoByCodeScoped(empresaId: number, code: string) {
  const emp = await prisma.empleadoDigital.findFirst({
    where: {
      empresaId,
      template: { code },
    },
    include: { template: true },
  })
  if (!emp) {
    throw new EmpleadoSecurityError("Empleado digital no encontrado", 404, "EMPLEADO_NOT_FOUND")
  }
  return emp
}

export async function loadTareaScoped(empresaId: number, tareaId: bigint | number) {
  const id = typeof tareaId === "bigint" ? tareaId : BigInt(tareaId)
  const tarea = await prisma.empleadoDigitalTarea.findFirst({
    where: { id, empresaId },
  })
  if (!tarea) {
    throw new EmpleadoSecurityError("Tarea no encontrada", 404, "TAREA_NOT_FOUND")
  }
  return tarea
}

const ACTIVE: EmpleadoEstado[] = ["activo", "trial"]

export function assertEmpleadoRunnable(estado: string) {
  if (!ACTIVE.includes(estado as EmpleadoEstado)) {
    throw new EmpleadoSecurityError(
      `Leo está ${estado}. Activalo o reanudalo para correr.`,
      409,
      "EMPLEADO_INACTIVE",
    )
  }
}

/** SKUs que habilitan Leo (nuevo + legacy) */
export function leoSkus(): string[] {
  return [LEO_COBRANZA_SKU, LEO_LEGACY_SKU]
}

/**
 * Verifica que el tool context no se “escape” de empresa.
 * Usar en cada tool al inicio.
 */
export function assertToolScope(
  ctx: { empresaId: number },
  expectedEmpresaId: number,
  label = "tool",
) {
  if (ctx.empresaId !== expectedEmpresaId) {
    throw new EmpleadoSecurityError(
      `Scope multi-tenant inválido en ${label}`,
      500,
      "TENANT_SCOPE_VIOLATION",
    )
  }
  if (!Number.isFinite(ctx.empresaId) || ctx.empresaId <= 0) {
    throw new EmpleadoSecurityError("empresaId inválido", 400, "INVALID_EMPRESA")
  }
}
