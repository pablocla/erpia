/**
 * ED-15: despachador multi-template.
 * Leo → orchestrator HITL. Resto del roster → playbooks determinísticos.
 */

import { runLeoCobranza } from "./orchestrator"
import { LEO_COBRANZA_CODE, type RunTrigger } from "../types"
import { EmpleadoSecurityError } from "../security"
import { getTemplateByCode } from "../catalog/templates"
import { runPlaybook } from "@/lib/automation/playbook-runner"

export type RunEmpleadoResult = Awaited<ReturnType<typeof runLeoCobranza>> & {
  code: string
}

/** code → playbookKey (primer playbook del template) */
const PLAYBOOK_CODES: Record<string, string> = {
  sofia_turnos: "agenda_reminder",
  ramiro_stock: "stock_bajo_tarea",
  ana_reposicion: "stock_bajo_tarea",
  clara_afip: "cae_fallido_retry",
  pedro_picking: "pedido_b2b_picking",
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

  if (code === LEO_COBRANZA_CODE) {
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
  }

  const playbookKey = PLAYBOOK_CODES[code] ?? getTemplateByCode(code)?.playbookKeys[0]
  if (!playbookKey) {
    throw new EmpleadoSecurityError(
      `Empleado "${code}" aún no tiene motor de corrida.`,
      400,
      "EMPLEADO_RUN_UNSUPPORTED",
    )
  }

  const result = await runPlaybook(input.empresaId, playbookKey)
  const skipped = result.actions.some((a) => a.startsWith("sin_")) ? 1 : 0
  const drafts = result.actions.filter((a) => a.startsWith("oc_borrador") || a.startsWith("wa_turnos")).length

  return {
    runId: `playbook:${playbookKey}`,
    pathUsado: "rules",
    resumen: result.error ?? result.actions.join(" · ") ?? "ok",
    tokensIn: 0,
    tokensOut: 0,
    accionesCount: result.actions.length,
    draftsCreados: drafts,
    skipped,
    detalles: [{ playbookKey, ok: result.ok, actions: result.actions }],
    code,
  }
}
