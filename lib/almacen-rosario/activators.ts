import { saveAlmacenRosarioConfig, DEFAULT_ALMACEN_ROSARIO_CONFIG } from "./config"
import { asegurarTiposEnvaseGaseosa } from "./envase-pos-service"
import { PROMOS_CANTIDAD_DEFAULT } from "./promos-cantidad-service"
import { RETAIL_EXTENSION_SKUS, type RetailExtensionSku } from "./retail-skus"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
async function log(empresaId: number, sku: string, msg: string) {
  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "marketplace",
    contexto: "almacen-rosario",
    mensaje: msg,
    metadata: { sku, pack: "almacen-rosario" },
  })
}

export async function activarPackAlmacenRosario(empresaId: number) {
  await saveAlmacenRosarioConfig(empresaId, DEFAULT_ALMACEN_ROSARIO_CONFIG)
  await log(empresaId, "pool-almacen-rosario", "Pack Almacén Rosario — config inicial aplicada")
}

export async function activarMargenGuard(empresaId: number) {
  await saveAlmacenRosarioConfig(empresaId, {})
  await log(empresaId, "pos.margen_guard", "Guardián de margen POS activado")
}

export async function activarZeroWaste(empresaId: number) {
  await saveAlmacenRosarioConfig(empresaId, {})
  await log(empresaId, "pos.zero_waste", "Zero Waste Bot activado")
}

export async function activarStockCeroAlert(empresaId: number) {
  await log(empresaId, "pos.stock_cero_alert", "Alerta stock cero activada")
}

export async function activarPromosPago(empresaId: number) {
  await saveAlmacenRosarioConfig(empresaId, {})
  await log(empresaId, "pos.promos_pago", "Copiloto promos medios de pago activado")
}

export async function activarListaDistribuidora(empresaId: number) {
  await log(empresaId, "pos.lista_distribuidora", "Importador listas distribuidoras activado")
}

export async function activarPanicoVecinal(empresaId: number) {
  await saveAlmacenRosarioConfig(empresaId, {})
  await log(empresaId, "pos.panico_vecinal", "Botón pánico vecinal activado")
}

export async function activarEnvasesGaseosas(empresaId: number) {
  await asegurarTiposEnvaseGaseosa(empresaId)
  await log(empresaId, "pos.envases_gaseosas", "Envases de gaseosas — tipos default cargados")
}

export async function activarValeDinero(empresaId: number) {
  await log(empresaId, "pos.vale_dinero", "Vale de dinero activado en POS")
}

async function activarRetailExtension(empresaId: number, sku: RetailExtensionSku) {
  if (sku === "pos.promos_cantidad") {
    await saveAlmacenRosarioConfig(empresaId, {
      promosCantidad: PROMOS_CANTIDAD_DEFAULT,
    } as Parameters<typeof saveAlmacenRosarioConfig>[1])
  }
  await log(empresaId, sku, `Retail extension ${sku} activada`)
}

export const activadoresRetail: Record<RetailExtensionSku, (empresaId: number) => Promise<void>> =
  Object.fromEntries(
    RETAIL_EXTENSION_SKUS.map((sku) => [sku, (id: number) => activarRetailExtension(id, sku)]),
  ) as Record<RetailExtensionSku, (empresaId: number) => Promise<void>>

export async function activarRecargasServicios(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.recargas_servicios")
}
export async function activarBalanzaPeso(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.balanza_peso")
}
export async function activarPromosCantidad(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.promos_cantidad")
}
export async function activarTicketRegalo(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.ticket_regalo")
}
export async function activarPedidoDistribuidora(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.pedido_distribuidora")
}
export async function activarMermasRoturas(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.mermas_roturas")
}
export async function activarArqueoCiego(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.arqueo_ciego")
}
export async function activarListaMayoristaPos(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.lista_mayorista_pos")
}
export async function activarChequesCartera(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.cheques_cartera")
}
export async function activarInventarioExpress(empresaId: number) {
  await activarRetailExtension(empresaId, "pos.inventario_express")
}