/**
 * Guard "AFIP apagado" por empresa (p. ej. tenant Velde).
 *
 * Una empresa queda SIN AFIP si:
 *  - tiene override explícito FeatureEmpresa `facturacion_afip` con activado=false, o
 *  - su config fiscal es `fiscal_modo_comprobante = ticket_solo`.
 *
 * Importante: solo se mira el override EXPLÍCITO de la empresa (no la cascada de
 * rubro), porque la cascada devuelve false cuando no hay fila y eso apagaría AFIP
 * a todos los tenants que nunca configuraron la feature.
 *
 * No toca lib/afip/*: solo decide si el handler de venta puede pedir CAE.
 */
import { prisma } from "@/lib/prisma"
import { getFiscalEmissionConfig } from "@/lib/fiscal/emission-config"

export const FEATURE_FACTURACION_AFIP = "facturacion_afip"

export type AfipOffMotivo = "feature_off" | "ticket_solo"

export interface AfipOffResult {
  off: boolean
  motivo?: AfipOffMotivo
}

export async function afipDeshabilitadoParaEmpresa(empresaId: number): Promise<AfipOffResult> {
  const override = await prisma.featureEmpresa.findUnique({
    where: { empresaId_featureKey: { empresaId, featureKey: FEATURE_FACTURACION_AFIP } },
    select: { activado: true },
  })
  if (override && override.activado === false) return { off: true, motivo: "feature_off" }

  const cfg = await getFiscalEmissionConfig(empresaId)
  if (cfg.modoComprobante === "ticket_solo") return { off: true, motivo: "ticket_solo" }

  return { off: false }
}
