import type { ProductRunbook, RunbookPaso } from "@/lib/marketplace/product-runbooks"
import { NICHE_APPS } from "./niche-apps-catalog"

function nicheRb(
  sku: string,
  nombre: string,
  goldenPath: string,
  pasosExtra: RunbookPaso[] = [],
): ProductRunbook {
  return {
    sku,
    nombre,
    autoCertLevel: "GLOBAL_AUTO",
    ccaFase: "CCA-030",
    activacionCliente: `Marketplace → ${nombre} → ${goldenPath}`,
    otorgamiento: "SuscripcionModulo + hook activarNicheApp + modoLite niche",
    postventa: "Upsell com.whatsapp + intang.cobranzas_wa si hay deudores",
    pasos: [
      { orden: 1, titulo: "Activar SKU", ejecutor: "sistema", descripcion: `provisionSku(${sku})` },
      { orden: 2, titulo: "Alta clientes/socios", ejecutor: "cliente", descripcion: "/dashboard/clientes" },
      { orden: 3, titulo: "Primer registro", ejecutor: "cliente", descripcion: goldenPath },
      { orden: 4, titulo: "WhatsApp ON (opcional)", ejecutor: "cliente", descripcion: "com.whatsapp para avisos masivos" },
      ...pasosExtra,
    ],
    escalacionSi: ["Sin migración niche_movimientos", "WhatsApp no conectado"],
  }
}

export const NICHE_PRODUCT_RUNBOOKS: Record<string, ProductRunbook> = Object.fromEntries(
  NICHE_APPS.map((app) => [
    app.sku,
    nicheRb(
      app.sku,
      app.nombre,
      app.goldenPath,
      app.appId === "consorcios"
        ? [
            {
              orden: 5,
              titulo: "Liquidar expensas test",
              ejecutor: "analista",
              descripcion: "Alta edificio → gasto → liquidar período",
            },
          ]
        : app.appId === "plancha"
          ? [
              {
                orden: 5,
                titulo: "Ticket LISTO + WA",
                ejecutor: "analista",
                descripcion: "Crear ticket → marcar listo → verificar cola WA",
              },
            ]
          : [],
    ),
  ]),
)