import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import {
  ANALYST_PLAYBOOKS,
  getPlaybookById,
  type AnalystPlaybook,
  type PlaybookCategoria,
  type PlaybookRiesgo,
} from "@/lib/ops/analyst-playbooks-catalog"
import { capturarSnapshotEntorno } from "@/lib/ops/entorno-sync-service"
import { getEmpresaReadiness } from "@/lib/ops/readiness-service"
import { crearOpsJob, ensureTenantEntornos } from "@/lib/ops/ops-service"
import { sincronizarBacklogDesdeFuentes } from "@/lib/ops/scrum-service"
import { ejecutarAccionProductoTenant } from "@/lib/ops/tenant-admin-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { validarLimiteActivacion } from "@/lib/ops/tenant-plan-service"

export type { AnalystPlaybook, PlaybookCategoria, PlaybookRiesgo }
export { ANALYST_PLAYBOOKS, getPlaybookById }

export interface PlaybookStepResult {
  paso: string
  ok: boolean
  detalle?: string
  error?: string
}

export async function ejecutarPlaybookAnalista(
  empresaId: number,
  playbookId: string,
  actorEmail: string,
): Promise<{ playbook: AnalystPlaybook; steps: PlaybookStepResult[]; ok: boolean }> {
  const playbook = getPlaybookById(playbookId)
  if (!playbook) throw new Error("Playbook no encontrado")

  await validarLimiteActivacion(empresaId, { requierePlaybooks: true })

  const steps: PlaybookStepResult[] = []
  const origen = `playbook:${playbookId}:${actorEmail}`

  try {
    switch (playbookId) {
      case "diagnostico_readiness": {
        const r = await getEmpresaReadiness(empresaId)
        steps.push({
          paso: "Readiness",
          ok: true,
          detalle: `Score ${r.score}% · go-live ${r.listoGoLive ? "OK" : "pendiente"}`,
        })
        break
      }
      case "health_entornos": {
        const entornos = await ensureTenantEntornos(empresaId)
        for (const ent of entornos) {
          await crearOpsJob({
            empresaId,
            entornoId: ent.id,
            tipo: "healthcheck",
            iniciadoPor: origen,
          })
          steps.push({ paso: `Health ${ent.codigo}`, ok: true, detalle: "Job encolado" })
        }
        break
      }
      case "snapshot_val": {
        await capturarSnapshotEntorno(empresaId, "val", actorEmail)
        steps.push({ paso: "Snapshot VAL", ok: true, detalle: "configSnapshot guardado" })
        break
      }
      case "sync_scrum": {
        const scrum = await sincronizarBacklogDesdeFuentes(empresaId, actorEmail)
        steps.push({
          paso: "Scrum sync",
          ok: true,
          detalle: `${scrum.items.length} ítems en backlog`,
        })
        break
      }
      case "pack_almacen_barrio": {
        const pack = MARKETPLACE_BUNDLES.find((b) => b.id === "pool-almacen-barrio")
        if (!pack) throw new Error("Pack pool-almacen-barrio no encontrado")
        const r = await ejecutarAccionProductoTenant(
          empresaId,
          { action: "provision_pack", packId: pack.id },
          actorEmail,
        )
        steps.push({
          paso: "Provision pack",
          ok: true,
          detalle: `${(r as { results?: unknown[] }).results?.length ?? pack.skus.length} SKUs`,
        })
        break
      }
      case "enganche_fiado": {
        const r = await ejecutarAccionProductoTenant(
          empresaId,
          { action: "provision", sku: "pos.fiado_barrio" },
          actorEmail,
        )
        steps.push({ paso: "Provision fiado", ok: true, detalle: JSON.stringify(r) })
        break
      }
      case "backup_migrate_smoke": {
        for (const tipo of ["backup_db", "migrate_db", "test_suite"] as const) {
          await crearOpsJob({ empresaId, tipo, iniciadoPor: origen })
          steps.push({ paso: tipo, ok: true, detalle: "Job encolado" })
        }
        break
      }
      default:
        throw new Error("Playbook sin implementación")
    }

    await persistSistemaLog({
      empresaId,
      severidad: "info",
      categoria: "ops",
      contexto: `playbook:${playbookId}`,
      mensaje: `Playbook ${playbook.nombre} ejecutado por ${actorEmail}`,
      metadata: { steps: steps.length },
    })

    return { playbook, steps, ok: steps.every((s) => s.ok) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error en playbook"
    steps.push({ paso: "Error", ok: false, error: msg })
    await persistSistemaLog({
      empresaId,
      severidad: "error",
      categoria: "ops",
      contexto: `playbook:${playbookId}`,
      mensaje: `Fallo playbook ${playbook.nombre}: ${msg}`,
    })
    return { playbook, steps, ok: false }
  }
}