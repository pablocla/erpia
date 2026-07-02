/**
 * Activación de módulos visibles por industria — solo lo que el rubro necesita.
 */

import { prisma } from "@/lib/prisma"
import {
  generarConfiguracionOnboarding,
  type Rubro,
  type RespuestasOnboarding,
} from "@/lib/onboarding/onboarding-ia"

function defaultAnswers(rubro: Rubro): RespuestasOnboarding {
  return {
    rubro,
    tamano: "pequeno",
    tieneStock: true,
    tienePersonal: true,
    necesitaFacturacion: true,
    necesitaContabilidad: false,
    condicionAfip: "monotributista",
    tieneLocal: true,
    tieneDelivery: rubro === "bar_restaurant",
    tieneMozos: rubro === "bar_restaurant",
  }
}

const MODULOS_VALIDOS = [
  "compras",
  "ventas",
  "stock",
  "caja",
  "contabilidad",
  "hospitalidad",
  "agenda",
  "historia_clinica",
  "membresias",
  "onboarding",
  "ia",
  "logistica",
  "industria",
  "picking",
  "iot",
] as const

/** ERP module id → configuracionModulo keys */
const ERP_TO_SIDEBAR: Record<string, (typeof MODULOS_VALIDOS)[number][]> = {
  pos: ["ventas"],
  ventas: ["ventas"],
  clientes: ["ventas"],
  compras: ["compras"],
  proveedores: ["compras"],
  productos: ["stock"],
  stock: ["stock"],
  caja: ["caja"],
  banco: ["caja"],
  contabilidad: ["contabilidad"],
  impuestos: ["contabilidad"],
  hospitalidad: ["hospitalidad"],
  agenda: ["agenda"],
  historia_clinica: ["historia_clinica"],
  "membresías": ["membresias"],
  membresias: ["membresias"],
  logistica: ["logistica"],
  industria: ["industria"],
  picking: ["picking"],
  iot: ["iot"],
  agro: ["iot", "logistica", "compras", "ventas", "stock"],
  prestamos: ["ventas", "caja"],
  reportes: ["ia"],
  usuarios: ["onboarding"],
  configuracion: ["onboarding"],
  onboarding: ["onboarding"],
  rrhh: ["onboarding"],
}

export async function setIndustryModules(empresaId: number, rubro: Rubro): Promise<string[]> {
  const config = generarConfiguracionOnboarding(defaultAnswers(rubro))
  const enabled = new Set<(typeof MODULOS_VALIDOS)[number]>(["onboarding"])

  for (const mod of config.modulosActivos) {
    const mapped = ERP_TO_SIDEBAR[mod] ?? ERP_TO_SIDEBAR[mod.replace("í", "i")] ?? []
    for (const key of mapped) {
      enabled.add(key)
    }
    if ((MODULOS_VALIDOS as readonly string[]).includes(mod)) {
      enabled.add(mod as (typeof MODULOS_VALIDOS)[number])
    }
  }

  await prisma.$transaction(
    MODULOS_VALIDOS.map((modulo) =>
      prisma.configuracionModulo.upsert({
        where: { empresaId_modulo: { empresaId, modulo } },
        update: { habilitado: enabled.has(modulo) },
        create: { empresaId, modulo, habilitado: enabled.has(modulo) },
      }),
    ),
  )

  return [...enabled]
}