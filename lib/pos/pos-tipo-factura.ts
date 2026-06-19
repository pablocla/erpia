import { getParametro } from "@/lib/config/parametro-service"
import { isFeatureActiva } from "@/lib/config/rubro-config-service"
import { getTESVentaPorCondicion, getTipoCbteAFIP } from "@/lib/tes/tes-config"

export type TipoFacturaPos = "A" | "B" | "C" | "ticket"

function normalizarCondicionIva(condicion: string): string {
  const map: Record<string, string> = {
    RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
    CONSUMIDOR_FINAL: "Consumidor Final",
    MONOTRIBUTISTA: "Monotributista",
    EXENTO: "Exento",
  }
  return map[condicion] ?? condicion
}

export function tipoFacturaSugerido(condicionIva?: string | null): TipoFacturaPos {
  if (!condicionIva) return "B"
  const tes = getTESVentaPorCondicion(normalizarCondicionIva(condicionIva))
  const cbte = getTipoCbteAFIP(tes)
  if (cbte === 1) return "A"
  if (cbte === 11) return "C"
  return "B"
}

export function letraDesdeTipoCbte(tipoCbte: number): string {
  const tipos: Record<number, string> = {
    1: "A", 2: "A", 3: "A",
    6: "B", 7: "B", 8: "B",
    11: "C", 12: "C", 13: "C",
    201: "A", 202: "A", 203: "A",
    206: "B", 207: "B", 208: "B",
    211: "C", 212: "C", 213: "C",
  }
  return tipos[tipoCbte] ?? "B"
}

export async function resolverTipoCbtePos(
  empresaId: number,
  baseTipoCbte: number,
  total: number,
  cliente?: { esGranEmpresa?: boolean | null } | null,
): Promise<number> {
  const moduloMipymeActivo = await isFeatureActiva(empresaId, "factura_mipymes")
  if (!moduloMipymeActivo || !cliente?.esGranEmpresa) return baseTipoCbte

  const umbralMipyme = await getParametro(empresaId, "umbral_mipyme", 5468127, "AR")
  if (total < umbralMipyme) return baseTipoCbte

  if (baseTipoCbte === 1) return 201
  if (baseTipoCbte === 6) return 206
  if (baseTipoCbte === 11) return 211
  return baseTipoCbte
}