/**
 * SKUs retail adicionales (no duplican marketplace existente).
 */
export const RETAIL_EXTENSION_SKUS = [
  "pos.recargas_servicios",
  "pos.balanza_peso",
  "pos.promos_cantidad",
  "pos.ticket_regalo",
  "pos.pedido_distribuidora",
  "pos.mermas_roturas",
  "pos.arqueo_ciego",
  "pos.lista_mayorista_pos",
  "pos.cheques_cartera",
  "pos.inventario_express",
] as const

export type RetailExtensionSku = (typeof RETAIL_EXTENSION_SKUS)[number]

export const RETAIL_SKU_META: Record<
  RetailExtensionSku,
  { nombre: string; lema: string; precioArs: number }
> = {
  "pos.recargas_servicios": {
    nombre: "Recargas y Servicios",
    lema: "SUBE, celular y pagos en el mostrador.",
    precioArs: 2990,
  },
  "pos.balanza_peso": {
    nombre: "Venta por Peso",
    lema: "Verdulería y fiambrería en la balanza.",
    precioArs: 2490,
  },
  "pos.promos_cantidad": {
    nombre: "Promos por Cantidad",
    lema: "2×1, 3×2 y llevá N pagá M en caja.",
    precioArs: 1990,
  },
  "pos.ticket_regalo": {
    nombre: "Ticket Regalo",
    lema: "Devolución sin devolver efectivo.",
    precioArs: 1490,
  },
  "pos.pedido_distribuidora": {
    nombre: "Pedido Distribuidora",
    lema: "Un toque: OC al reparto con lo urgente.",
    precioArs: 3490,
  },
  "pos.mermas_roturas": {
    nombre: "Mermas y Roturas",
    lema: "Registrá pérdida en 2 taps.",
    precioArs: 1490,
  },
  "pos.arqueo_ciego": {
    nombre: "Arqueo Ciego",
    lema: "El cajero no ve el saldo esperado.",
    precioArs: 1990,
  },
  "pos.lista_mayorista_pos": {
    nombre: "Lista Mayorista POS",
    lema: "Precio por bulto en un botón.",
    precioArs: 1990,
  },
  "pos.cheques_cartera": {
    nombre: "Cheques en Cartera",
    lema: "Cobrá cheque y controlá vencimiento.",
    precioArs: 2490,
  },
  "pos.inventario_express": {
    nombre: "Inventario Express",
    lema: "Conteo rápido por categoría.",
    precioArs: 2990,
  },
}