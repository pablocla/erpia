/**
 * Mensajería comercial Pack Almacén Rosario — lenguaje dueño de almacén, no técnico.
 */
import { MODULOS_ALMACEN_ROSARIO } from "./modulos-catalog"
import { CLAVIS_CORE } from "@/lib/marketing/pricing-catalog"

export const ALMACEN_ROSARIO_BUNDLE_ID = "pool-almacen-rosario"

/** Dolor cotidiano por SKU (para vitrina, guía y ventas) */
export const DOLOR_POR_SKU: Record<string, string> = {
  "pos.margen_guard":
    "Subió el precio del distribuidor y seguís vendiendo como ayer: perdés plata sin darte cuenta.",
  "pos.zero_waste":
    "Te queda mercadería por vencer y la tirás o la regalás sin control.",
  "pos.stock_cero_alert":
    "Vendés igual con stock en cero y el dueño se entera tarde.",
  "pos.promos_pago":
    "El cajero no recuerda qué banco o billetera tiene reintegro hoy.",
  "pos.lista_distribuidora":
    "Actualizás precios a mano desde el Excel de Micropack o Vital.",
  "pos.panico_vecinal":
    "En una situación de riesgo no tenés un botón discreto para avisar.",
  "pos.envases_gaseosas":
    "Los cajones de gaseosa se anotan en un cuaderno y nunca cierran.",
  "pos.vale_dinero":
    "Emitís vales en papel y no sabés si quedan saldo o si son válidos.",
  "pos.recargas_servicios":
    "SUBE y recargas se cobran aparte y no quedan en la caja del día.",
  "pos.balanza_peso":
    "En verdulería calculás peso × precio en la calculadora.",
  "pos.promos_cantidad":
    "El 2×1 lo aplicás a mano y a veces te equivocás.",
  "pos.ticket_regalo":
    "Devolvés con ticket casero o efectivo cuando podrías dar crédito en tienda.",
  "pos.pedido_distribuidora":
    "Te quedás sin un producto clave y armás el pedido al reparto a las corridas.",
  "pos.mermas_roturas":
    "Rotura o vencimiento no se registra y el stock no cierra.",
  "pos.arqueo_ciego":
    "El cajero ve el saldo del sistema antes de contar y maquillan diferencias.",
  "pos.lista_mayorista_pos":
    "El cliente de barrio mayorista pide precio por bulto y buscás en otra lista.",
  "pos.cheques_cartera":
    "Los cheques en cartera vencen y te enterás tarde.",
  "pos.inventario_express":
    "El inventario completo frena el mostrador una mañana entera.",
}

export const ALMACEN_ROSARIO_GRUPOS = [
  {
    id: "caja",
    nombre: "Caja y cobro",
    emoji: "💵",
    descripcion: "Vales, arqueo, cheques, tickets regalo y promos de pago.",
    skus: [
      "pos.vale_dinero",
      "pos.arqueo_ciego",
      "pos.cheques_cartera",
      "pos.promos_pago",
      "pos.ticket_regalo",
    ],
  },
  {
    id: "mostrador",
    nombre: "Mostrador",
    emoji: "🛒",
    descripcion: "Envases, balanza, recargas, 2×1 y lista mayorista en POS.",
    skus: [
      "pos.envases_gaseosas",
      "pos.balanza_peso",
      "pos.recargas_servicios",
      "pos.promos_cantidad",
      "pos.lista_mayorista_pos",
    ],
  },
  {
    id: "stock",
    nombre: "Stock y merma",
    emoji: "📦",
    descripcion: "Inventario rápido, mermas, pedido a distribuidora y stock cero.",
    skus: [
      "pos.inventario_express",
      "pos.mermas_roturas",
      "pos.pedido_distribuidora",
      "pos.stock_cero_alert",
      "pos.zero_waste",
    ],
  },
  {
    id: "margen",
    nombre: "Margen y seguridad",
    emoji: "🛡️",
    descripcion: "Listas de costo, margen mínimo y botón de pánico vecinal.",
    skus: ["pos.lista_distribuidora", "pos.margen_guard", "pos.panico_vecinal"],
  },
] as const

export const ALMACEN_ROSARIO_FAQ = [
  {
    pregunta: "¿Tengo que contratar los 18 módulos?",
    respuesta:
      "No. Podés activar el pack completo o solo lo que uses (envases, vales, lista, etc.). Todo se ve en el panel; lo no contratado aparece con candado.",
  },
  {
    pregunta: "¿Cuánto tarda en quedar listo?",
    respuesta:
      "La mayoría se activa en minutos (automático regional). Entrás a App Store, Obtener App, y el módulo pasa a Activo en el panel Almacén.",
  },
  {
    pregunta: "¿Cuánto pago en total con el ERP?",
    respuesta: `Clavis Core (ERP + AFIP) desde ${CLAVIS_CORE.priceMonthly.toLocaleString("es-AR")} ARS/mes + Pack Almacén Rosario $34.900/mes si tomás el pack completo. También podés sumar módulos sueltos.`,
  },
  {
    pregunta: "¿Funciona sin internet?",
    respuesta:
      "El POS sigue vendiendo con contingencia fiscal (CAEA) según tu plan Core. Algunos módulos del pack necesitan conexión para sincronizar (listas, alertas, pánico WA).",
  },
  {
    pregunta: "¿Para qué tipo de comercio es?",
    respuesta:
      "Almacenes de barrio, kioscos, verdulerías, depósitos de bebidas y autoservicios chicos que venden en mostrador con caja y AFIP.",
  },
] as const

export const ALMACEN_ROSARIO_CASOS = [
  {
    titulo: "Kiosco con fiado y gaseosas",
    modulos: ["Envases de gaseosas", "Vale de dinero", "Libreta fiado", "Recargas SUBE"],
    ahorro: "Menos cuadernos, caja que cierra sola.",
  },
  {
    titulo: "Verdulería de barrio",
    modulos: ["Venta por peso", "Zero Waste", "Promos 2×1", "Mermas"],
    ahorro: "Precio por kg en POS y menos pérdida por vencimiento.",
  },
  {
    titulo: "Depósito con lista de distribuidora",
    modulos: ["Importador listas", "Guardián de margen", "Pedido distribuidora", "Inventario express"],
    ahorro: "Precios al día sin Excel y sin vender debajo del costo.",
  },
] as const

export const VISIBILIDAD_MENSAJE =
  "Todos los módulos se ven en el panel y en el POS. Lo que no contrataste aparece con candado: activás en un clic desde App Store."

export function modulosPorGrupo() {
  const bySku = Object.fromEntries(MODULOS_ALMACEN_ROSARIO.map((m) => [m.sku, m]))
  return ALMACEN_ROSARIO_GRUPOS.map((g) => ({
    ...g,
    modulos: g.skus.map((sku) => bySku[sku]).filter(Boolean),
  }))
}

export function precioSueltoTotalArs(): number {
  return MODULOS_ALMACEN_ROSARIO.reduce((acc, m) => acc + m.precioArs, 0)
}