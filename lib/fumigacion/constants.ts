/** Dominio fumigación / control de plagas — labels y catálogos */

export const FUMIGACION_TIPOS_PLAGA = [
  { id: "cucarachas", label: "Cucarachas" },
  { id: "roedores", label: "Roedores" },
  { id: "hormigas", label: "Hormigas" },
  { id: "mosquitos", label: "Mosquitos / dengue" },
  { id: "chinches", label: "Chinches" },
  { id: "termitas", label: "Termitas" },
  { id: "desinsectacion", label: "Desinsectación general" },
  { id: "desinfeccion", label: "Desinfección / sanitización" },
  { id: "otro", label: "Otro" },
] as const

export type FumigacionTipoPlaga = (typeof FUMIGACION_TIPOS_PLAGA)[number]["id"]

export const FUMIGACION_TIPOS_SERVICIO = [
  { id: "visita_inicial", label: "Visita inicial / diagnóstico" },
  { id: "tratamiento", label: "Tratamiento" },
  { id: "mantenimiento", label: "Mantenimiento (abono)" },
  { id: "urgencia", label: "Urgencia" },
  { id: "certificado", label: "Certificado / constancia" },
] as const

export const FUMIGACION_ESTADOS_VISITA = [
  { id: "PENDIENTE", label: "Pendiente", color: "pendiente" },
  { id: "EN_PROCESO", label: "En camino / en sitio", color: "visita" },
  { id: "LISTO", label: "Tratado", color: "visitada" },
  { id: "ENTREGADO", label: "Cerrado + firmado", color: "cerrado" },
  { id: "CANCELADO", label: "Cancelado", color: "omitida" },
] as const

/** Menú mínimo de valor para empresa de fumigaciones (sin ruido retail/agro/etc.) */
export const FUMIGACION_MENU_LABELS: Record<string, string> = {
  "/dashboard/fumigacion": "Hoy · Ruta",
  "/dashboard/ot": "Órdenes de servicio",
  "/dashboard/clientes": "Clientes y sitios",
  "/dashboard/agenda": "Agenda",
  "/dashboard/ventas/presupuestos": "Presupuestos",
  "/dashboard/ventas": "Facturación",
  "/dashboard/cuentas-cobrar": "Cobros",
  "/dashboard/facturacion-recurrente": "Abonos",
  "/dashboard/productos": "Insumos",
  "/dashboard/caja": "Caja",
  "/dashboard/mercadopago": "Mercado Pago",
  "/dashboard/impuestos": "Fiscal / AFIP",
}

export function labelPlaga(id: string | null | undefined): string {
  if (!id) return "—"
  return FUMIGACION_TIPOS_PLAGA.find((p) => p.id === id)?.label ?? id
}

export function labelTipoServicio(id: string | null | undefined): string {
  if (!id) return "—"
  return FUMIGACION_TIPOS_SERVICIO.find((p) => p.id === id)?.label ?? id
}
