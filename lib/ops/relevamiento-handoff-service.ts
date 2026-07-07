/**
 * Sprint 3 — Handoff automático relevamiento campo → torre Claver Cloud.
 * Crea tarea de implementación cuando el vendedor carga una visita.
 */

import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { crearTareaMarketplace } from "@/lib/marketplace/analyst-task-service"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"
import type { RelevamientoRow } from "@/lib/ops/comercial-relevamiento-service"
import { engancheSugeridoPorRubro } from "@/lib/ops/comercial-relevamiento-enganche"
import {
  esPackPropiedad,
  provisionarPoolPropiedad,
} from "@/lib/comercial/hybrid-provision-bridge"

function db() {
  return prisma as any
}

export interface RelevamientoHandoffResult {
  handoffId: string
  tipo: "tarea_marketplace" | "torre_log"
  leadId: number | null
}

function prioridadDesdeInteres(nivel: string): string {
  if (nivel === "alto" || nivel === "muy_alto") return "alta"
  if (nivel === "bajo") return "baja"
  return "media"
}

function skuDesdeRelevamiento(enganche: string | null, rubro: string | null): string {
  if (enganche && enganche !== "indefinido") return enganche
  if (rubro) {
    const sugerido = engancheSugeridoPorRubro(rubro)
    if (sugerido !== "indefinido") return sugerido
  }
  return "core.claver"
}

/**
 * Dispara handoff post-relevamiento. Si el lead ya tiene empresa, crea MarketplaceTareaAnalista.
 * Si no, registra tarea en torre (SistemaLog) para que el analista convierta a cliente.
 */
export async function handoffDesdeRelevamiento(
  relevamiento: RelevamientoRow,
  leadId: number | null,
  leadEmpresaId: number | null,
): Promise<RelevamientoHandoffResult> {
  const sku = skuDesdeRelevamiento(relevamiento.engancheCandidato, relevamiento.rubro)
  const item = resolveSku(sku)
  const nombreProducto = item?.nombre ?? "Claver ERP"
  const prioridad = prioridadDesdeInteres(relevamiento.nivelInteres)

  if (leadEmpresaId) {
    if (esPackPropiedad(sku)) {
      const prov = await provisionarPoolPropiedad(leadEmpresaId, "relevamiento")
      await persistSistemaLog({
        empresaId: leadEmpresaId,
        severidad: "info",
        categoria: "comercial",
        contexto: "relevamiento-handoff",
        mensaje: `Auto-provisión pool-propiedad desde relevamiento #${relevamiento.id}`,
        metadata: {
          relevamientoId: relevamiento.id,
          leadId,
          sku: prov.packId,
          origen: "slg",
          href: prov.landingPath,
        },
      })
      return { handoffId: `prov-${relevamiento.id}`, tipo: "tarea_marketplace", leadId }
    }

    const tarea = await crearTareaMarketplace({
      empresaId: leadEmpresaId,
      sku,
      nombre: nombreProducto,
      autoCertLevel: item?.autoCertLevel ?? "SEMI_AUTO",
      prioridad,
    })

    await persistSistemaLog({
      empresaId: leadEmpresaId,
      severidad: "info",
      categoria: "comercial",
      contexto: "relevamiento-handoff",
      mensaje: `Tarea creada desde relevamiento #${relevamiento.id} — ${relevamiento.negocio}`,
      metadata: {
        relevamientoId: relevamiento.id,
        leadId,
        tareaId: tarea.id,
        sku,
      },
    })

    return { handoffId: tarea.id, tipo: "tarea_marketplace", leadId }
  }

  const handoffId = `rel-handoff-${relevamiento.id}-${Date.now()}`

  await persistSistemaLog({
    empresaId: 0,
    severidad: "info",
    categoria: "comercial",
    contexto: "relevamiento-handoff",
    mensaje: `[Torre] Relevamiento #${relevamiento.id}: ${relevamiento.negocio} — convertir a cliente`,
    metadata: {
      handoffId,
      relevamientoId: relevamiento.id,
      leadId,
      negocio: relevamiento.negocio,
      enganche: relevamiento.engancheCandidato,
      sku,
      nivelInteres: relevamiento.nivelInteres,
      trialAceptado: relevamiento.trialAceptado,
      accion: "convertir_relevamiento",
      href: `/claver-cloud/comercial/relevamientos?highlight=${relevamiento.id}`,
    },
  })

  if (leadId) {
    try {
      await db().comercialPipelineLead.update({
        where: { id: leadId },
        data: {
          etapa: relevamiento.trialAceptado ? "trial" : "calificar",
          proximaAccion: `Handoff torre — relevamiento #${relevamiento.id}`,
          notas: `[Auto] ${relevamiento.dolorPrincipal ?? "Sin dolor"} · SKU ${sku}`,
        },
      })
    } catch {
      /* pipeline opcional */
    }
  }

  return { handoffId, tipo: "torre_log", leadId }
}