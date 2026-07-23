/**
 * ED-15: despachador multi-template (genérico).
 * Hoy: leo_cobranza → runLeoCobranza. Futuro: sofia, ramiro, etc.
 */

import { runLeoCobranza } from "./orchestrator"
import { LEO_COBRANZA_CODE, type RunTrigger } from "../types"
import { EmpleadoSecurityError } from "../security"

export type RunEmpleadoResult = Awaited<ReturnType<typeof runLeoCobranza>> & {
  code: string
}

export async function runEmpleado(input: {
  empresaId: number
  code: string
  empleadoId?: number
  trigger?: RunTrigger
  userId?: number
  dryRun?: boolean
}): Promise<RunEmpleadoResult> {
  const code = input.code.trim()

  switch (code) {
    case LEO_COBRANZA_CODE:
      return {
        ...(await runLeoCobranza({
          empresaId: input.empresaId,
          empleadoId: input.empleadoId,
          trigger: input.trigger,
          userId: input.userId,
          dryRun: input.dryRun,
        })),
        code,
      }
    default:
      throw new EmpleadoSecurityError(
        `Empleado "${code}" aún no tiene motor de corrida (solo leo_cobranza).`,
        400,
        "EMPLEADO_RUN_UNSUPPORTED",
      )
  }
}
