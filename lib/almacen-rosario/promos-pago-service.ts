/**
 * #5 Copiloto promociones medios de pago — calendario configurable.
 */
import { getAlmacenRosarioConfig } from "./config"

export interface PromoHoy {
  id: string
  titulo: string
  reintegroPct: number
  medios: string[]
  mensajeCajero: string
}

export async function promocionesDelDia(empresaId: number, fecha = new Date()): Promise<PromoHoy[]> {
  const config = await getAlmacenRosarioConfig(empresaId)
  const dia = fecha.getDay()

  return config.promociones
    .filter((p) => p.activo && p.diasSemana.includes(dia))
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      reintegroPct: p.reintegroPct,
      medios: p.medios,
      mensajeCajero: `Ofrecé ${p.medios.join("/")} — ${p.titulo} (${p.reintegroPct}% reintegro)`,
    }))
}

export function promoParaMedio(promos: PromoHoy[], medio: string): PromoHoy | undefined {
  return promos.find((p) => p.medios.includes(medio))
}