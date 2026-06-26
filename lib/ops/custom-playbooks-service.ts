import { prisma } from "@/lib/prisma"
import { getProyectoPorEmpresa } from "@/lib/ops/implementacion-service"
import { getTenantPlan } from "@/lib/ops/tenant-plan-service"
import { ejecutarPlaybookAnalista } from "@/lib/ops/analyst-playbooks"
import { ejecutarAccionProductoTenant, type TenantProductoAccion } from "@/lib/ops/tenant-admin-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

export interface CustomPlaybookAction {
  tipo: "producto" | "playbook_builtin"
  action?: TenantProductoAccion
  sku?: string
  packId?: string
  playbookId?: string
}

export interface CustomPlaybook {
  id: string
  nombre: string
  descripcion?: string
  acciones: CustomPlaybookAction[]
  createdAt: string
  createdBy: string
}

function db() {
  return prisma as any
}

async function loadCustomPlaybooks(empresaId: number): Promise<CustomPlaybook[]> {
  const proyecto = await getProyectoPorEmpresa(empresaId)
  if (!proyecto) return []
  const meta = (proyecto.metadata ?? {}) as Record<string, unknown>
  return Array.isArray(meta.customPlaybooks) ? (meta.customPlaybooks as CustomPlaybook[]) : []
}

async function saveCustomPlaybooks(empresaId: number, playbooks: CustomPlaybook[]) {
  const proyecto = await getProyectoPorEmpresa(empresaId)
  if (!proyecto) throw new Error("Proyecto de implementación requerido para playbooks custom")
  const meta = (proyecto.metadata && typeof proyecto.metadata === "object" ? proyecto.metadata : {}) as Record<string, unknown>
  await db().proyectoImplementacion.update({
    where: { empresaId },
    data: { metadata: { ...meta, customPlaybooks: playbooks }, updatedAt: new Date() },
  })
}

export async function listCustomPlaybooks(empresaId: number) {
  return loadCustomPlaybooks(empresaId)
}

export async function crearCustomPlaybook(
  empresaId: number,
  input: { nombre: string; descripcion?: string; acciones: CustomPlaybookAction[] },
  actorEmail: string,
) {
  const plan = await getTenantPlan(empresaId)
  if (!plan.playbooksCustom) {
    throw new Error(`Plan ${plan.id} no incluye playbooks personalizados (Enterprise)`)
  }
  const list = await loadCustomPlaybooks(empresaId)
  const pb: CustomPlaybook = {
    id: `cpb-${Date.now()}`,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion,
    acciones: input.acciones,
    createdAt: new Date().toISOString(),
    createdBy: actorEmail,
  }
  list.push(pb)
  await saveCustomPlaybooks(empresaId, list)
  return pb
}

export async function eliminarCustomPlaybook(empresaId: number, playbookId: string) {
  const list = await loadCustomPlaybooks(empresaId)
  const next = list.filter((p) => p.id !== playbookId)
  await saveCustomPlaybooks(empresaId, next)
  return { deleted: list.length !== next.length }
}

export async function ejecutarCustomPlaybook(empresaId: number, playbookId: string, actorEmail: string) {
  const plan = await getTenantPlan(empresaId)
  if (!plan.playbooksCustom) {
    throw new Error(`Plan ${plan.id} no incluye playbooks personalizados`)
  }
  const list = await loadCustomPlaybooks(empresaId)
  const pb = list.find((p) => p.id === playbookId)
  if (!pb) throw new Error("Playbook custom no encontrado")

  const steps: { paso: string; ok: boolean; detalle?: string; error?: string }[] = []

  for (const acc of pb.acciones) {
    try {
      if (acc.tipo === "playbook_builtin" && acc.playbookId) {
        const r = await ejecutarPlaybookAnalista(empresaId, acc.playbookId, actorEmail)
        steps.push({ paso: acc.playbookId, ok: r.ok, detalle: `${r.steps.length} pasos` })
      } else if (acc.tipo === "producto" && acc.action) {
        await ejecutarAccionProductoTenant(
          empresaId,
          { action: acc.action, sku: acc.sku, packId: acc.packId },
          actorEmail,
        )
        steps.push({ paso: `${acc.action} ${acc.sku ?? acc.packId ?? ""}`.trim(), ok: true })
      }
    } catch (err) {
      steps.push({ paso: acc.playbookId ?? acc.action ?? "acción", ok: false, error: String(err) })
    }
  }

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "ops",
    contexto: `custom-playbook:${playbookId}`,
    mensaje: `Playbook custom ${pb.nombre} ejecutado`,
  })

  return { playbook: pb, steps, ok: steps.every((s) => s.ok) }
}