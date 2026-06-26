/**
 * Servicios operativos Claver Cloud ofrecidos como producto (Super Admin + automatizaciones).
 * Comercial: docs/operaciones/CLAVER_CLOUD_SUPERADMIN.md
 */

export interface ClaverOpsService {
  sku: string
  nombre: string
  lema: string
  descripcion: string
  incluye: string[]
  precioArs: number
  tipoCobro: "recurrente" | "por_uso"
  autoCertLevel: "HUMAN_GATE"
}

export const CLAVER_OPS_SERVICES: ClaverOpsService[] = [
  {
    sku: "ops.claver_superadmin",
    nombre: "Claver Super Admin Panel",
    lema: "Goberná el tenant sin pedirle la clave al cliente.",
    descripcion:
      "Panel super administrador por tenant: catálogo SKUs, readiness, impersonación ERP y playbooks de ejecución automática.",
    incluye: [
      "Dashboard de flota multi-tenant",
      "Activar/provisionar/desactivar 51 SKUs y packs",
      "Impersonación ERP con auditoría",
      "7 playbooks ops (health, snapshot VAL, packs, etc.)",
    ],
    precioArs: 0,
    tipoCobro: "recurrente",
    autoCertLevel: "HUMAN_GATE",
  },
  {
    sku: "ops.playbooks_auto",
    nombre: "Playbooks de ejecución automática",
    lema: "Un botón, toda la secuencia.",
    descripcion: "Automatizaciones predefinidas ejecutadas por analista desde Cloud (backup, migrate, enganches, Scrum sync).",
    incluye: ["Catálogo extensible de playbooks", "Log en sistemaLog por ejecución", "Integración con jobs ops"],
    precioArs: 14900,
    tipoCobro: "recurrente",
    autoCertLevel: "HUMAN_GATE",
  },
]

export function getOpsServiceBySku(sku: string) {
  return CLAVER_OPS_SERVICES.find((s) => s.sku === sku)
}