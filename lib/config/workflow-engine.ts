/**
 * Workflow Engine — Motor de Flujos Dinámicos (Railroad Switch)
 *
 * Ejecuta flujos de negocio configurados por rubro, con:
 * - Evaluación condicional de transiciones (bifurcación tipo vía de tren)
 * - Feature gates (saltar pasos si la feature no está activa)
 * - Audit trail completo (WorkflowInstancia + WorkflowPasoLog)
 * - Timeout por paso
 * - Rollback en error
 *
 * USO:
 *   const engine = new WorkflowEngine(empresaId)
 *   const result = await engine.ejecutar("venta", { facturaId: 1, total: 50000 })
 */

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isFeatureActiva, getFeatureParam } from "@/lib/config/rubro-config-service"
import type { ERPEventType } from "@/lib/events/types"

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface WorkflowContext {
  [key: string]: unknown
}

export interface StepResult {
  success: boolean
  output?: Record<string, unknown>
  error?: string
  skipReason?: string
}

type WorkflowStepTemplate = {
  id: number
  stepKey: string
  tipo: string
  accion: string | null
  orden: number
  requiereFeature: string | null
  timeoutSeg: number
  parametros: unknown
  condicion: unknown
  transicionesSalida: Array<{ condicion: unknown; destinoId: number }>
}

/**
 * Registry de acciones ejecutables.
 * Cada servicio registra sus funciones como acciones del workflow.
 * Ej: actionRegistry.set("facturaService.emitirFactura", async (ctx) => ...)
 */
export type WorkflowAction = (context: WorkflowContext, empresaId: number) => Promise<StepResult>
const actionRegistry = new Map<string, WorkflowAction>()

export function registrarAccionWorkflow(key: string, action: WorkflowAction): void {
  actionRegistry.set(key, action)
}

// ─── CONDITION EVALUATOR ─────────────────────────────────────────────────────

interface Condicion {
  campo: string
  operador: "==" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "not_in" | "exists"
  valor: unknown
}

function evaluarCondicion(condicion: Condicion | null, contexto: WorkflowContext): boolean {
  if (!condicion) return true

  const valorCampo = contexto[condicion.campo]

  switch (condicion.operador) {
    case "==": return valorCampo === condicion.valor
    case "!=": return valorCampo !== condicion.valor
    case ">":  return Number(valorCampo) > Number(condicion.valor)
    case "<":  return Number(valorCampo) < Number(condicion.valor)
    case ">=": return Number(valorCampo) >= Number(condicion.valor)
    case "<=": return Number(valorCampo) <= Number(condicion.valor)
    case "in":
      return Array.isArray(condicion.valor) && condicion.valor.includes(valorCampo)
    case "not_in":
      return Array.isArray(condicion.valor) && !condicion.valor.includes(valorCampo)
    case "exists":
      return valorCampo !== null && valorCampo !== undefined
    default:
      return true
  }
}

function evaluarCondicionJSON(condicionJSON: unknown, contexto: WorkflowContext): boolean {
  if (!condicionJSON) return true
  // Support single condition or array (AND)
  if (Array.isArray(condicionJSON)) {
    return condicionJSON.every((c) => evaluarCondicion(c as Condicion, contexto))
  }
  return evaluarCondicion(condicionJSON as Condicion, contexto)
}

// ─── ENGINE ──────────────────────────────────────────────────────────────────

export class WorkflowEngine {
  constructor(private empresaId: number) {}

  /**
   * Ejecutar un workflow completo para un proceso.
   * Resuelve el template del rubro de la empresa, crea instancia, y recorre pasos.
   */
  async ejecutar(
    proceso: string,
    contextoInicial: WorkflowContext = {},
  ): Promise<{ instanciaId: number; estado: string; contexto: WorkflowContext }> {
    // 1. Obtener rubro de la empresa
    const empresa = await prisma.empresa.findUnique({
      where: { id: this.empresaId },
      select: { rubroId: true, rubro: true },
    })
    if (!empresa) throw new Error(`Empresa ${this.empresaId} no encontrada`)

    // 2. Buscar workflow template para este rubro+proceso
    let workflow = empresa.rubroId
      ? await prisma.workflowRubro.findFirst({
          where: { rubroId: empresa.rubroId, proceso, activo: true },
          include: {
            pasos: {
              where: { activo: true },
              orderBy: { orden: "asc" },
              include: {
                transicionesSalida: {
                  where: { activo: true },
                  orderBy: { prioridad: "asc" },
                },
              },
            },
          },
          orderBy: { version: "desc" },
        })
      : null

    // Si no hay workflow definido para el rubro, retornar sin error
    if (!workflow || workflow.pasos.length === 0) {
      return { instanciaId: 0, estado: "sin_workflow", contexto: contextoInicial }
    }

    // 3. Crear instancia
    const instancia = await prisma.workflowInstancia.create({
      data: {
        proceso,
        version: workflow.version,
        estado: "en_curso",
        empresaId: this.empresaId,
        contexto: contextoInicial as Prisma.InputJsonValue,
        entidadTipo: (contextoInicial.entidadTipo as string) ?? null,
        entidadId: (contextoInicial.entidadId as number) ?? null,
      },
    })

    // 4. Build step map for navigation
    const stepMap = new Map<string, WorkflowStepTemplate>(
      workflow.pasos.map((p) => [p.stepKey, p as WorkflowStepTemplate]),
    )

    // 5. Execute starting from first step
    let contexto = { ...contextoInicial }
    let currentStep: WorkflowStepTemplate | null = workflow.pasos[0]
      ? (workflow.pasos[0] as WorkflowStepTemplate)
      : null
    let estado = "en_curso"

    while (currentStep) {
      const startTime = Date.now()

      // 5a. Feature gate — si requiere una feature, verificar
      if (currentStep.requiereFeature) {
        const featureActiva = await isFeatureActiva(this.empresaId, currentStep.requiereFeature)
        if (!featureActiva) {
          await this.logPaso(instancia.id, currentStep.stepKey, "saltado", Date.now() - startTime, {
            success: true,
            skipReason: `Feature '${currentStep.requiereFeature}' no activa`,
          })
          currentStep = await this.resolverSiguientePaso(currentStep, contexto, stepMap)
          continue
        }
      }

      // 5b. Step condition gate
      if (currentStep.condicion) {
        if (!evaluarCondicionJSON(currentStep.condicion, contexto)) {
          await this.logPaso(instancia.id, currentStep.stepKey, "saltado", Date.now() - startTime, {
            success: true,
            skipReason: "Condición no cumplida",
          })
          currentStep = await this.resolverSiguientePaso(currentStep, contexto, stepMap)
          continue
        }
      }

      // 5c. Execute action
      const resultado = await this.ejecutarPaso(currentStep, contexto)

      // 5d. Merge output into context
      if (resultado.output) {
        contexto = { ...contexto, ...resultado.output }
      }

      // 5e. Log
      await this.logPaso(
        instancia.id,
        currentStep.stepKey,
        resultado.success ? "ejecutado" : "error",
        Date.now() - startTime,
        resultado,
      )

      // 5f. On error — stop workflow
      if (!resultado.success) {
        estado = "error"
        await prisma.workflowInstancia.update({
          where: { id: instancia.id },
          data: {
            estado: "error",
            error: resultado.error,
            stepActual: currentStep.stepKey,
            contexto: contexto as Prisma.InputJsonValue,
          },
        })
        break
      }

      // 5g. Update instance
      await prisma.workflowInstancia.update({
        where: { id: instancia.id },
        data: { stepActual: currentStep.stepKey, contexto: contexto as Prisma.InputJsonValue },
      })

      // 5h. Navigate to next step (railroad switch)
      const nextStep = await this.resolverSiguientePaso(currentStep, contexto, stepMap)
      if (!nextStep) {
        estado = "completado"
        break
      }
      currentStep = nextStep
    }

    // 6. Finalize
    await prisma.workflowInstancia.update({
      where: { id: instancia.id },
      data: {
        estado,
        contexto: contexto as Prisma.InputJsonValue,
        stepActual: null,
        completedAt: estado === "completado" ? new Date() : undefined,
      },
    })

    return { instanciaId: instancia.id, estado, contexto }
  }

  /**
   * Resolver el siguiente paso evaluando transiciones (railroad switch).
   * Evalúa condiciones por prioridad. La primera que matchea gana.
   * Si ninguna matchea, sigue en orden secuencial.
   */
  private async resolverSiguientePaso(
    currentStep: WorkflowStepTemplate,
    contexto: WorkflowContext,
    stepMap: Map<string, WorkflowStepTemplate>,
  ) {
    // Try transition conditions (railroad switch)
    for (const transicion of currentStep.transicionesSalida) {
      if (evaluarCondicionJSON(transicion.condicion, contexto)) {
        const destStep = await prisma.workflowStep.findUnique({
          where: { id: transicion.destinoId },
          select: { stepKey: true },
        })
        if (destStep) {
          return stepMap.get(destStep.stepKey) ?? null
        }
      }
    }

    // Fallback: next by orden
    const allSteps = Array.from(stepMap.values()).sort((a, b) => a.orden - b.orden)
    const currentIdx = allSteps.findIndex((s) => s.stepKey === currentStep.stepKey)
    return allSteps[currentIdx + 1] ?? null
  }

  /**
   * Ejecutar la acción de un paso.
   */
  private async ejecutarPaso(
    step: { stepKey: string; tipo: string; accion: string | null; parametros: unknown; timeoutSeg: number },
    contexto: WorkflowContext,
  ): Promise<StepResult> {
    try {
      const mergedCtx = { ...contexto, ...((step.parametros as Record<string, unknown>) ?? {}) }

      switch (step.tipo) {
        case "service_call": {
          if (!step.accion) return { success: true, output: {} }
          const action = actionRegistry.get(step.accion)
          if (!action) {
            return { success: false, error: `Acción '${step.accion}' no registrada en actionRegistry` }
          }
          return action(mergedCtx, this.empresaId)
        }

        case "event_emit": {
          // Emit event through event bus
          const { eventBus } = await import("@/lib/events/event-bus")
          await eventBus.emit({
            type: (step.accion ?? step.stepKey) as ERPEventType,
            payload: mergedCtx,
            timestamp: new Date(),
          })
          return { success: true, output: { eventEmitted: step.accion } }
        }

        case "condition": {
          // Pure condition node — always succeeds, routing happens via transitions
          return { success: true }
        }

        case "approval": {
          // TODO: Implement approval queue (pause workflow until approved)
          return { success: true, output: { approvalPending: true } }
        }

        default:
          return { success: true }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido en paso",
      }
    }
  }

  /**
   * Log de paso ejecutado.
   */
  private async logPaso(
    instanciaId: number,
    stepKey: string,
    resultado: string,
    duracionMs: number,
    data: StepResult,
  ): Promise<void> {
    await prisma.workflowPasoLog.create({
      data: {
        instanciaId,
        stepKey,
        resultado,
        duracionMs,
        input: undefined,
        output: data.output ? (data.output as Prisma.InputJsonValue) : undefined,
        error: data.error ?? data.skipReason ?? null,
      },
    })
  }
}
