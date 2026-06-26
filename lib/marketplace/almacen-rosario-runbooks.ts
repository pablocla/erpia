/**
 * Runbooks Pack Almacén Rosario — generados desde modulos-catalog.
 */
import { MODULOS_ALMACEN_ROSARIO } from "@/lib/almacen-rosario/modulos-catalog"
import type { ProductRunbook, RunbookPaso } from "./product-runbooks"

function rbAlmacen(modulo: (typeof MODULOS_ALMACEN_ROSARIO)[number]): ProductRunbook {
  const pasos: RunbookPaso[] = [
    { orden: 1, titulo: "Activar SKU", ejecutor: "cliente", descripcion: modulo.activacion },
    { orden: 2, titulo: "Hook sistema", ejecutor: "sistema", descripcion: `activarProducto(${modulo.sku}) + product-hooks` },
    ...modulo.pasosUso.map((p, i) => ({
      orden: i + 3,
      titulo: `Uso ${i + 1}`,
      ejecutor: "cliente" as const,
      descripcion: p,
    })),
    {
      orden: modulo.pasosUso.length + 3,
      titulo: "Verificación",
      ejecutor: "analista",
      descripcion: `Probar flujo en ${modulo.superficie === "pos" ? "POS" : "panel Almacén"} — doc §${modulo.docAnchor}`,
    },
  ]

  return {
    sku: modulo.sku,
    nombre: modulo.nombre,
    autoCertLevel: "REGION_AUTO",
    ccaFase: "CCA-030",
    activacionCliente: `App Store → ${modulo.nombre} → Obtener App`,
    otorgamiento: `SuscripcionModulo ${modulo.sku} + hook onActivate`,
    postventa: `Monitorear uso en panel /dashboard/almacen; escalar si API ${modulo.api ?? "N/A"} falla`,
    pasos,
    escalacionSi: ["SKU activo pero 403 en API", "Cliente sin caja abierta (módulos caja)"],
  }
}

export const ALMACEN_ROSARIO_RUNBOOKS: Record<string, ProductRunbook> = Object.fromEntries(
  MODULOS_ALMACEN_ROSARIO.map((m) => [m.sku, rbAlmacen(m)]),
)