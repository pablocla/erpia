/**
 * Configuración Pack Almacén Rosario — persistida en featureEmpresa.
 */
import { getFeatureConfig, setFeature } from "@/lib/config/rubro-config-service"
import { skusAlmacenRosario } from "./modulos-catalog"

export const FEATURE_ALMACEN_ROSARIO = "almacen.rosario"

export interface PromoMedioPago {
  id: string
  diasSemana: number[]
  medios: string[]
  titulo: string
  reintegroPct: number
  activo: boolean
}

export interface AlmacenRosarioConfig {
  margen: {
    bloquearVenta: boolean
    autoAjustarPrecio: boolean
    margenDefaultPct: number
  }
  zeroWaste: {
    diasDescuento30: number
    pctDescuento30: number
    diasDescuento50: number
    pctDescuento50: number
    verduleriaTardeDesde: number
    verduleriaTardePct: number
  }
  panico: {
    telefonos: string[]
    mensaje: string
  }
  promociones: PromoMedioPago[]
  promosCantidad?: import("./promos-cantidad-service").PromoCantidad[]
}

export const DEFAULT_ALMACEN_ROSARIO_CONFIG: AlmacenRosarioConfig = {
  margen: {
    bloquearVenta: false,
    autoAjustarPrecio: true,
    margenDefaultPct: 30,
  },
  zeroWaste: {
    diasDescuento30: 3,
    pctDescuento30: 30,
    diasDescuento50: 1,
    pctDescuento50: 50,
    verduleriaTardeDesde: 18,
    verduleriaTardePct: 15,
  },
  panico: {
    telefonos: [],
    mensaje: "ALERTA SILENCIOSA — comercio en situación de riesgo",
  },
  promociones: [
    {
      id: "miercoles-bsf",
      diasSemana: [3],
      medios: ["qr", "tarjeta_debito", "tarjeta_credito"],
      titulo: "Miércoles: reintegro Banco Santa Fe en QR/tarjeta",
      reintegroPct: 30,
      activo: true,
    },
    {
      id: "jueves-modo",
      diasSemana: [4],
      medios: ["qr"],
      titulo: "Jueves: promoción MODO — ofrecé pagar con QR",
      reintegroPct: 25,
      activo: true,
    },
  ],
}

export async function getAlmacenRosarioConfig(empresaId: number): Promise<AlmacenRosarioConfig> {
  const f = await getFeatureConfig(empresaId, FEATURE_ALMACEN_ROSARIO)
  const p = f.parametros as Partial<AlmacenRosarioConfig> | undefined
  if (!p) return DEFAULT_ALMACEN_ROSARIO_CONFIG
  return {
    margen: { ...DEFAULT_ALMACEN_ROSARIO_CONFIG.margen, ...p.margen },
    zeroWaste: { ...DEFAULT_ALMACEN_ROSARIO_CONFIG.zeroWaste, ...p.zeroWaste },
    panico: { ...DEFAULT_ALMACEN_ROSARIO_CONFIG.panico, ...p.panico },
    promociones: p.promociones ?? DEFAULT_ALMACEN_ROSARIO_CONFIG.promociones,
    promosCantidad: p.promosCantidad,
  }
}

export async function saveAlmacenRosarioConfig(
  empresaId: number,
  partial: Partial<AlmacenRosarioConfig>,
): Promise<AlmacenRosarioConfig> {
  const current = await getAlmacenRosarioConfig(empresaId)
  const merged: AlmacenRosarioConfig = {
    margen: { ...current.margen, ...partial.margen },
    zeroWaste: { ...current.zeroWaste, ...partial.zeroWaste },
    panico: { ...current.panico, ...partial.panico },
    promociones: partial.promociones ?? current.promociones,
    promosCantidad: partial.promosCantidad ?? current.promosCantidad,
  }
  await setFeature(empresaId, FEATURE_ALMACEN_ROSARIO, { activado: true, parametros: merged })
  return merged
}

export const ALMACEN_ROSARIO_SKUS = skusAlmacenRosario() as unknown as readonly [
  string,
  ...string[],
]

export type AlmacenRosarioSku = (typeof ALMACEN_ROSARIO_SKUS)[number]