import { prisma } from "@/lib/prisma"
import { MARKETPLACE_CATALOG } from "./marketplace-catalog"

export async function seedMarketplaceCatalog() {
  for (const item of MARKETPLACE_CATALOG) {
    const metadata = {
      playbookId: item.playbookId,
      autoCertLevel: item.autoCertLevel,
      paisesHabilitados: item.paisesHabilitados,
      segmentoAds: item.segmentoAds,
      status: item.status,
      i18n: item.i18n,
      trialDias: item.trialDias,
    }

    await prisma.productoComercial.upsert({
      where: { sku: item.sku },
      create: {
        sku: item.sku,
        nombre: item.nombre,
        descripcion: item.i18n["es-AR"]?.descripcion || item.nombre,
        precioArs: item.precioArs,
        limiteEventosMes: item.tipoCobro === "por_uso" ? 0 : null,
        activo: item.status !== "planned",
        metadata,
      },
      update: {
        nombre: item.nombre,
        descripcion: item.i18n["es-AR"]?.descripcion || item.nombre,
        precioArs: item.precioArs,
        limiteEventosMes: item.tipoCobro === "por_uso" ? 0 : null,
        activo: item.status !== "planned",
        metadata,
      },
    })
  }
}
