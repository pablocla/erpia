/**
 * Checklist de auditoría POS — usar en reviews manuales y QA automatizado.
 * Cada flujo tiene criterios medibles (pass/fail).
 */

export const POS_DEVICE_VIEWPORTS = [
  { id: "mobile", width: 390, height: 844, label: "iPhone / almacén celular" },
  { id: "tablet", width: 768, height: 1024, label: "Tablet mostrador" },
  { id: "desktop", width: 1280, height: 800, label: "PC caja" },
] as const

export type PosUxFlowId =
  | "apertura_caja"
  | "venta_efectivo"
  | "venta_fiado"
  | "cobro_modal"
  | "barcode"
  | "suspendida"
  | "offline"
  | "cierre_turno"

export interface PosUxCriterion {
  id: string
  descripcion: string
  /** Sin scroll vertical en viewport mobile para completar el paso */
  sinScrollMobile?: boolean
  /** CTA principal visible sin scroll en modal cobro */
  ctaVisibleModal?: boolean
  touchMinPx?: number
}

export const POS_UX_FLOWS: Record<PosUxFlowId, { nombre: string; criterios: PosUxCriterion[] }> = {
  apertura_caja: {
    nombre: "Apertura de caja",
    criterios: [
      { id: "banner_caja", descripcion: "Si caja cerrada, banner visible con link a Caja" },
      { id: "bloqueo_cobro", descripcion: "COBRAR y FIAR deshabilitados sin caja abierta" },
    ],
  },
  venta_efectivo: {
    nombre: "Venta efectivo mostrador",
    criterios: [
      { id: "buscar_producto", descripcion: "Búsqueda enfocable con / o F1" },
      { id: "agregar_touch", descripcion: "Grilla productos touch ≥44px", touchMinPx: 44 },
      { id: "confirmar_visible", descripcion: "Confirmar cobro visible sin scroll", ctaVisibleModal: true, sinScrollMobile: true },
      { id: "nueva_venta", descripcion: "Post-venta: Nueva venta visible sin scroll", ctaVisibleModal: true },
    ],
  },
  venta_fiado: {
    nombre: "Venta a fiado (almacén)",
    criterios: [
      { id: "sku_activo", descripcion: "Requiere pos.fiado_barrio activo" },
      { id: "cliente_fiado", descripcion: "Selector prioriza clientes con fiado" },
      { id: "boton_fiar", descripcion: "FIAR visible en barra móvil y carrito sheet" },
      { id: "notificacion", descripcion: "Toast/email post fiado" },
    ],
  },
  cobro_modal: {
    nombre: "Modal de cobro",
    criterios: [
      { id: "footer_fijo", descripcion: "Total + Confirmar en footer sticky", ctaVisibleModal: true, sinScrollMobile: true },
      { id: "numpad_colapsable", descripcion: "Teclado numérico colapsado por default en móvil" },
      { id: "medios_rapidos", descripcion: "6 medios de pago en grid 3×2" },
    ],
  },
  barcode: {
    nombre: "Escáner código de barras",
    criterios: [
      { id: "scan_enter", descripcion: "Enter tras buffer ≥4 chars agrega producto" },
      { id: "not_found", descripcion: "Toast si código no existe" },
    ],
  },
  suspendida: {
    nombre: "Venta suspendida",
    criterios: [
      { id: "suspender", descripcion: "Suspender guarda en localStorage" },
      { id: "recuperar", descripcion: "Recuperar restaura carrito" },
    ],
  },
  offline: {
    nombre: "Modo offline básico",
    criterios: [
      { id: "indexeddb", descripcion: "Fallo red guarda en IndexedDB y muestra ticket offline" },
    ],
  },
  cierre_turno: {
    nombre: "Cierre X/Z",
    criterios: [
      { id: "link_cierre", descripcion: "Acceso Cierre desde topbar POS" },
    ],
  },
}

/** IDs de archivos críticos para code review POS */
export const POS_ARCHIVOS_CRITICOS = [
  "app/dashboard/pos/page.tsx",
  "lib/pos/pos-layout-config.ts",
  "hooks/use-pos-layout.ts",
  "components/pos/pos-cart-sheet.tsx",
  "components/pos/pos-alert-strip.tsx",
  "components/pos/pos-plu-bar.tsx",
  "app/api/pos/venta/route.ts",
  "lib/pos/pos-tipo-factura.ts",
] as const

export function listarCriteriosTotales(): number {
  return Object.values(POS_UX_FLOWS).reduce((n, f) => n + f.criterios.length, 0)
}