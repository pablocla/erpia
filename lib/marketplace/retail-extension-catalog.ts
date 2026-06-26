import { RETAIL_EXTENSION_SKUS, RETAIL_SKU_META } from "@/lib/almacen-rosario/retail-skus"

export const RETAIL_EXTENSION_CATALOG = RETAIL_EXTENSION_SKUS.map((sku) => {
  const meta = RETAIL_SKU_META[sku]
  return {
    sku,
    nombre: meta.nombre,
    categoria: "Operaciones",
    precioArs: meta.precioArs,
    tipoCobro: "recurrente",
    autoCertLevel: "REGION_AUTO",
    paisesHabilitados: ["AR"],
    i18n: {
      "es-AR": {
        nombre: meta.nombre,
        descripcion: meta.lema,
        packOnboardSubject: meta.lema,
      },
    },
    segmentoAds: ["almacen", "kiosco", "retail"],
    playbookId: `playbook.${sku}`,
    dependeDe: ["core.pos"],
    status: "disponible",
    trialDias: 7,
  }
})