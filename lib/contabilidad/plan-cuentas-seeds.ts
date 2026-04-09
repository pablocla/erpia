/**
 * Plan de cuentas base por rubro de empresa.
 *
 * Cada rubro tiene un plan base que se inyecta como CuentaContable en la DB
 * cuando la empresa se crea o ejecuta el onboarding.
 *
 * El plan es extensible: la empresa puede agregar/desactivar cuentas después.
 */

export interface CuentaSeed {
  codigo: string
  nombre: string
  tipo: "activo" | "pasivo" | "patrimonio" | "ingreso" | "egreso"
  categoria: string
  nivel: number
  imputable: boolean
}

// ─── PLAN BASE COMÚN A TODOS LOS RUBROS ──────────────────────────────────────
const PLAN_BASE: CuentaSeed[] = [
  // ACTIVO — Nivel 1 (rubros)
  { codigo: "1", nombre: "Activo", tipo: "activo", categoria: "Activo", nivel: 1, imputable: false },
  { codigo: "1.1", nombre: "Caja", tipo: "activo", categoria: "Disponibilidades", nivel: 2, imputable: true },
  { codigo: "1.2", nombre: "Banco Cuenta Corriente", tipo: "activo", categoria: "Disponibilidades", nivel: 2, imputable: true },
  { codigo: "1.3", nombre: "Deudores por Ventas", tipo: "activo", categoria: "Créditos", nivel: 2, imputable: true },
  { codigo: "1.4", nombre: "Mercaderías", tipo: "activo", categoria: "Bienes de Cambio", nivel: 2, imputable: true },
  { codigo: "1.5", nombre: "Banco Caja de Ahorro", tipo: "activo", categoria: "Disponibilidades", nivel: 2, imputable: true },
  { codigo: "1.6", nombre: "IVA Crédito Fiscal", tipo: "activo", categoria: "Créditos Fiscales", nivel: 2, imputable: true },
  { codigo: "1.7", nombre: "Retenciones Sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 2, imputable: false },
  { codigo: "1.7.1", nombre: "Ret. IVA sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true },
  { codigo: "1.7.2", nombre: "Ret. Ganancias sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true },
  { codigo: "1.7.3", nombre: "Ret. IIBB sufridas", tipo: "activo", categoria: "Créditos Fiscales", nivel: 3, imputable: true },
  { codigo: "1.8", nombre: "IVA a Favor", tipo: "activo", categoria: "Créditos Fiscales", nivel: 2, imputable: true },

  // PASIVO — Nivel 1
  { codigo: "2", nombre: "Pasivo", tipo: "pasivo", categoria: "Pasivo", nivel: 1, imputable: false },
  { codigo: "2.1", nombre: "Proveedores", tipo: "pasivo", categoria: "Deudas Comerciales", nivel: 2, imputable: true },
  { codigo: "2.2", nombre: "IVA Débito Fiscal", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 2, imputable: true },
  { codigo: "2.3", nombre: "Percepciones a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 2, imputable: true },
  { codigo: "2.4", nombre: "Retenciones a Depositar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 2, imputable: false },
  { codigo: "2.4.1", nombre: "Ret. IVA a depositar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true },
  { codigo: "2.4.2", nombre: "Ret. Ganancias a depositar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true },
  { codigo: "2.4.3", nombre: "Ret. IIBB a depositar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 3, imputable: true },
  { codigo: "2.5", nombre: "IVA a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", nivel: 2, imputable: true },
  { codigo: "2.6", nombre: "Sueldos a Pagar", tipo: "pasivo", categoria: "Deudas Sociales", nivel: 2, imputable: true },
  { codigo: "2.7", nombre: "Cargas Sociales a Pagar", tipo: "pasivo", categoria: "Deudas Sociales", nivel: 2, imputable: true },

  // PATRIMONIO NETO
  { codigo: "3", nombre: "Patrimonio Neto", tipo: "patrimonio", categoria: "Patrimonio Neto", nivel: 1, imputable: false },
  { codigo: "3.1", nombre: "Capital", tipo: "patrimonio", categoria: "Capital", nivel: 2, imputable: true },
  { codigo: "3.2", nombre: "Resultados Acumulados", tipo: "patrimonio", categoria: "Resultados", nivel: 2, imputable: true },

  // INGRESOS
  { codigo: "4", nombre: "Ingresos", tipo: "ingreso", categoria: "Ingresos", nivel: 1, imputable: false },
  { codigo: "4.1", nombre: "Ventas", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 2, imputable: true },
  { codigo: "4.2", nombre: "Intereses Ganados", tipo: "ingreso", categoria: "Ingresos Financieros", nivel: 2, imputable: true },
  { codigo: "4.3", nombre: "Otros Ingresos", tipo: "ingreso", categoria: "Ingresos Varios", nivel: 2, imputable: true },

  // EGRESOS
  { codigo: "5", nombre: "Egresos", tipo: "egreso", categoria: "Egresos", nivel: 1, imputable: false },
  { codigo: "5.1", nombre: "Costo de Mercaderías Vendidas", tipo: "egreso", categoria: "Costos", nivel: 2, imputable: true },
  { codigo: "5.2", nombre: "Gastos de Administración", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.3", nombre: "Gastos de Comercialización", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.4", nombre: "Sueldos y Jornales", tipo: "egreso", categoria: "Gastos de Personal", nivel: 2, imputable: true },
  { codigo: "5.5", nombre: "Cargas Sociales", tipo: "egreso", categoria: "Gastos de Personal", nivel: 2, imputable: true },
  { codigo: "5.6", nombre: "Alquileres", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.7", nombre: "Servicios Públicos", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.8", nombre: "Intereses Perdidos", tipo: "egreso", categoria: "Gastos Financieros", nivel: 2, imputable: true },
]

// ─── CUENTAS ADICIONALES POR RUBRO ──────────────────────────────────────────

const EXTRAS_GASTRONOMIA: CuentaSeed[] = [
  { codigo: "1.4.1", nombre: "Mercadería - Alimentos", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.2", nombre: "Mercadería - Bebidas", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.3", nombre: "Mercadería - Descartables", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "4.1.1", nombre: "Ventas Salón", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.2", nombre: "Ventas Delivery", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.3", nombre: "Ventas Take Away", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.1.1", nombre: "CMV Alimentos", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.1.2", nombre: "CMV Bebidas", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Gastos de Cocina", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.10", nombre: "Comisiones Apps Delivery", tipo: "egreso", categoria: "Gastos de Comercialización", nivel: 2, imputable: true },
]

const EXTRAS_SALUD: CuentaSeed[] = [
  { codigo: "1.3.1", nombre: "Obras Sociales a Cobrar", tipo: "activo", categoria: "Créditos", nivel: 3, imputable: true },
  { codigo: "1.3.2", nombre: "Prepagas a Cobrar", tipo: "activo", categoria: "Créditos", nivel: 3, imputable: true },
  { codigo: "1.4.1", nombre: "Stock Medicamentos", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.2", nombre: "Stock Insumos Descartables", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "4.1.1", nombre: "Honorarios Profesionales", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.2", nombre: "Prestaciones OS/Prepagas", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.3", nombre: "Venta Medicamentos", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Insumos Médicos", tipo: "egreso", categoria: "Costos", nivel: 2, imputable: true },
  { codigo: "5.10", nombre: "Matriculas y Colegiaturas", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
]

const EXTRAS_HOTELERIA: CuentaSeed[] = [
  { codigo: "1.3.1", nombre: "Huéspedes Cuenta Corriente", tipo: "activo", categoria: "Créditos", nivel: 3, imputable: true },
  { codigo: "1.3.2", nombre: "OTAs a Cobrar", tipo: "activo", categoria: "Créditos", nivel: 3, imputable: true },
  { codigo: "4.1.1", nombre: "Ingresos por Alojamiento", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.2", nombre: "Ingresos Restaurante Hotel", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.3", nombre: "Ingresos Spa/Amenities", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.4", nombre: "Ingresos Eventos/Salones", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Amenities y Blanquería", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.10", nombre: "Comisiones OTAs", tipo: "egreso", categoria: "Gastos de Comercialización", nivel: 2, imputable: true },
  { codigo: "5.11", nombre: "Mantenimiento Edilicio", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
]

const EXTRAS_INDUSTRIA: CuentaSeed[] = [
  { codigo: "1.4.1", nombre: "Materias Primas", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.2", nombre: "Productos en Proceso", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.3", nombre: "Productos Terminados", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.4", nombre: "Materiales Auxiliares", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "5.1.1", nombre: "Consumo Materia Prima", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.1.2", nombre: "Mano de Obra Directa", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.1.3", nombre: "Carga Fabril", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Depreciación Maquinaria", tipo: "egreso", categoria: "Depreciaciones", nivel: 2, imputable: true },
  { codigo: "5.10", nombre: "Mantenimiento Planta", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
]

const EXTRAS_SERVICIOS: CuentaSeed[] = [
  { codigo: "4.1.1", nombre: "Ingresos por Servicios Prestados", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.2", nombre: "Ingresos por Consultoría", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.1.1", nombre: "Costo de Servicios Prestados", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Subcontrataciones", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.10", nombre: "Software y Licencias", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
]

const EXTRAS_AGRO: CuentaSeed[] = [
  { codigo: "1.4.1", nombre: "Hacienda", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.2", nombre: "Cereales y Oleaginosas", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.3", nombre: "Insumos Agroquímicos", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.4", nombre: "Semillas", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "4.1.1", nombre: "Ventas Granos", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.2", nombre: "Ventas Hacienda", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.1.1", nombre: "Costo Producción Agrícola", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.1.2", nombre: "Costo Producción Ganadera", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Arrendamientos Rurales", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
]

const EXTRAS_CONSTRUCCION: CuentaSeed[] = [
  { codigo: "1.4.1", nombre: "Materiales de Construcción", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "1.4.2", nombre: "Obras en Curso", tipo: "activo", categoria: "Bienes de Cambio", nivel: 3, imputable: true },
  { codigo: "4.1.1", nombre: "Certificaciones de Obra", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.1.1", nombre: "Materiales Consumidos", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.1.2", nombre: "Mano de Obra Obra", tipo: "egreso", categoria: "Costos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Alquiler Maquinaria Pesada", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
]

const EXTRAS_TRANSPORTE: CuentaSeed[] = [
  { codigo: "1.9", nombre: "Flota - Rodados", tipo: "activo", categoria: "Bienes de Uso", nivel: 2, imputable: true },
  { codigo: "4.1.1", nombre: "Ingresos por Fletes", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Combustible", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.10", nombre: "Peajes", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.11", nombre: "Mantenimiento Flota", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.12", nombre: "Seguros Flota", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
]

const EXTRAS_EDUCACION: CuentaSeed[] = [
  { codigo: "1.3.1", nombre: "Aranceles a Cobrar", tipo: "activo", categoria: "Créditos", nivel: 3, imputable: true },
  { codigo: "4.1.1", nombre: "Aranceles / Matrículas", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "4.1.2", nombre: "Cursos y Capacitaciones", tipo: "ingreso", categoria: "Ingresos Operativos", nivel: 3, imputable: true },
  { codigo: "5.9", nombre: "Material Didáctico", tipo: "egreso", categoria: "Gastos Operativos", nivel: 2, imputable: true },
  { codigo: "5.10", nombre: "Honorarios Docentes", tipo: "egreso", categoria: "Gastos de Personal", nivel: 2, imputable: true },
]

// ─── REGISTRY ────────────────────────────────────────────────────────────────

const EXTRAS_POR_RUBRO: Record<string, CuentaSeed[]> = {
  comercio: [],
  industria: EXTRAS_INDUSTRIA,
  servicios: EXTRAS_SERVICIOS,
  gastronomia: EXTRAS_GASTRONOMIA,
  salud: EXTRAS_SALUD,
  hoteleria: EXTRAS_HOTELERIA,
  agro: EXTRAS_AGRO,
  construccion: EXTRAS_CONSTRUCCION,
  transporte: EXTRAS_TRANSPORTE,
  educacion: EXTRAS_EDUCACION,
  otro: [],
}

/**
 * Retorna el plan de cuentas completo (base + extras del rubro)
 * ordenado jerárquicamente por código.
 */
export function obtenerPlanCuentasPorRubro(rubro: string): CuentaSeed[] {
  const extras = EXTRAS_POR_RUBRO[rubro] ?? []
  return [...PLAN_BASE, ...extras].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
}

/**
 * Retorna los mapeos de asientos automáticos por defecto para un rubro.
 * Cada rubro puede tener mapeos distintos (ej: gastronomía desglosa CMV por tipo).
 */
export function obtenerConfigAsientosPorDefecto(rubro: string): { tipoTransaccion: string; campo: string; cuentaCodigo: string; cuentaNombre: string }[] {
  const base = [
    // Ventas
    { tipoTransaccion: "venta", campo: "caja", cuentaCodigo: "1.1", cuentaNombre: "Caja" },
    { tipoTransaccion: "venta", campo: "ingreso", cuentaCodigo: "4.1", cuentaNombre: "Ventas" },
    { tipoTransaccion: "venta", campo: "iva_df", cuentaCodigo: "2.2", cuentaNombre: "IVA Débito Fiscal" },
    { tipoTransaccion: "venta", campo: "percepciones", cuentaCodigo: "2.3", cuentaNombre: "Percepciones a Pagar" },
    // Compras
    { tipoTransaccion: "compra", campo: "mercaderia", cuentaCodigo: "1.4", cuentaNombre: "Mercaderías" },
    { tipoTransaccion: "compra", campo: "iva_cf", cuentaCodigo: "1.6", cuentaNombre: "IVA Crédito Fiscal" },
    { tipoTransaccion: "compra", campo: "proveedores", cuentaCodigo: "2.1", cuentaNombre: "Proveedores" },
    // Cobros
    { tipoTransaccion: "cobro", campo: "caja", cuentaCodigo: "1.1", cuentaNombre: "Caja" },
    { tipoTransaccion: "cobro", campo: "banco", cuentaCodigo: "1.2", cuentaNombre: "Banco Cuenta Corriente" },
    { tipoTransaccion: "cobro", campo: "deudores", cuentaCodigo: "1.3", cuentaNombre: "Deudores por Ventas" },
    { tipoTransaccion: "cobro", campo: "ret_iva_sufrida", cuentaCodigo: "1.7.1", cuentaNombre: "Ret. IVA sufridas" },
    { tipoTransaccion: "cobro", campo: "ret_ganancias_sufrida", cuentaCodigo: "1.7.2", cuentaNombre: "Ret. Ganancias sufridas" },
    { tipoTransaccion: "cobro", campo: "ret_iibb_sufrida", cuentaCodigo: "1.7.3", cuentaNombre: "Ret. IIBB sufridas" },
    // Pagos
    { tipoTransaccion: "pago", campo: "proveedores", cuentaCodigo: "2.1", cuentaNombre: "Proveedores" },
    { tipoTransaccion: "pago", campo: "banco", cuentaCodigo: "1.2", cuentaNombre: "Banco Cuenta Corriente" },
    { tipoTransaccion: "pago", campo: "ret_iva_depositar", cuentaCodigo: "2.4.1", cuentaNombre: "Ret. IVA a depositar" },
    { tipoTransaccion: "pago", campo: "ret_ganancias_depositar", cuentaCodigo: "2.4.2", cuentaNombre: "Ret. Ganancias a depositar" },
    { tipoTransaccion: "pago", campo: "ret_iibb_depositar", cuentaCodigo: "2.4.3", cuentaNombre: "Ret. IIBB a depositar" },
    // NC
    { tipoTransaccion: "nc", campo: "ingreso", cuentaCodigo: "4.1", cuentaNombre: "Ventas" },
    { tipoTransaccion: "nc", campo: "iva_df", cuentaCodigo: "2.2", cuentaNombre: "IVA Débito Fiscal" },
    { tipoTransaccion: "nc", campo: "caja", cuentaCodigo: "1.1", cuentaNombre: "Caja" },
    // CMV
    { tipoTransaccion: "cmv", campo: "cmv", cuentaCodigo: "5.1", cuentaNombre: "Costo de Mercaderías Vendidas" },
    { tipoTransaccion: "cmv", campo: "mercaderia", cuentaCodigo: "1.4", cuentaNombre: "Mercaderías" },
    // Liquidación IVA
    { tipoTransaccion: "liquidacion_iva", campo: "iva_df", cuentaCodigo: "2.2", cuentaNombre: "IVA Débito Fiscal" },
    { tipoTransaccion: "liquidacion_iva", campo: "iva_cf", cuentaCodigo: "1.6", cuentaNombre: "IVA Crédito Fiscal" },
    { tipoTransaccion: "liquidacion_iva", campo: "iva_a_pagar", cuentaCodigo: "2.5", cuentaNombre: "IVA a Pagar" },
    { tipoTransaccion: "liquidacion_iva", campo: "iva_a_favor", cuentaCodigo: "1.8", cuentaNombre: "IVA a Favor" },
  ]

  return base
}

/**
 * Retorna los parámetros fiscales por defecto para un país.
 */
export function obtenerParametrosFiscalesPorDefecto(pais: string): { clave: string; valor: number; descripcion: string; categoria: string; pais: string; normativa: string | null }[] {
  if (pais === "AR") {
    return [
      { clave: "umbral_rg5824", valor: 10_000_000, descripcion: "Monto a partir del cual se requiere CUIT/CUIL en FC B/C (RG 5824/2026)", categoria: "fiscal", pais: "AR", normativa: "RG 5824/2026" },
      { clave: "tolerancia_3way_match", valor: 0.02, descripcion: "Tolerancia porcentual para 3-way matching en compras (2%)", categoria: "operativo", pais: "AR", normativa: null },
      { clave: "iva_alicuota_general", valor: 21, descripcion: "Alícuota general IVA", categoria: "fiscal", pais: "AR", normativa: "Ley 23.349" },
      { clave: "iva_alicuota_reducida", valor: 10.5, descripcion: "Alícuota reducida IVA", categoria: "fiscal", pais: "AR", normativa: "Ley 23.349" },
      { clave: "iva_alicuota_diferencial", valor: 27, descripcion: "Alícuota diferencial IVA (servicios)", categoria: "fiscal", pais: "AR", normativa: "Ley 23.349" },
      { clave: "ret_iva_rg2854_alicuota", valor: 0.5, descripcion: "Alícuota retención IVA RG 2854 (50%)", categoria: "fiscal", pais: "AR", normativa: "RG 2854" },
      { clave: "perc_iva_rg2408_alicuota", valor: 0.03, descripcion: "Alícuota percepción IVA RG 2408 (3%)", categoria: "fiscal", pais: "AR", normativa: "RG 2408" },
      { clave: "ret_ganancias_rg830_servicios", valor: 0.02, descripcion: "Retención Ganancias RG 830 servicios (2%)", categoria: "fiscal", pais: "AR", normativa: "RG 830" },
      { clave: "ret_ganancias_rg830_compra_bienes", valor: 0.02, descripcion: "Retención Ganancias RG 830 bienes (2%)", categoria: "fiscal", pais: "AR", normativa: "RG 830" },
      { clave: "iibb_pba_comercio", valor: 0.035, descripcion: "IIBB Buenos Aires - Comercio (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal PBA" },
      { clave: "iibb_pba_servicios", valor: 0.035, descripcion: "IIBB Buenos Aires - Servicios (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal PBA" },
      { clave: "iibb_caba_general", valor: 0.03, descripcion: "IIBB CABA - General (3%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal CABA" },
      { clave: "iibb_cordoba_general", valor: 0.04, descripcion: "IIBB Córdoba - General (4%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal CBA" },
      { clave: "iibb_santafe_general", valor: 0.035, descripcion: "IIBB Santa Fe - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal SF" },
      { clave: "iibb_mendoza_general", valor: 0.04, descripcion: "IIBB Mendoza - General (4%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal MZA" },
      { clave: "iibb_tucuman_general", valor: 0.035, descripcion: "IIBB Tucumán - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal TUC" },
      { clave: "iibb_entrerios_general", valor: 0.045, descripcion: "IIBB Entre Ríos - General (4.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal ER" },
      { clave: "iibb_misiones_general", valor: 0.033, descripcion: "IIBB Misiones - General (3.3%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal MIS" },
      { clave: "iibb_salta_general", valor: 0.035, descripcion: "IIBB Salta - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal STA" },
      { clave: "iibb_chaco_general", valor: 0.035, descripcion: "IIBB Chaco - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal CHA" },
      { clave: "iibb_corrientes_general", valor: 0.035, descripcion: "IIBB Corrientes - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal COR" },
      { clave: "iibb_santiago_general", valor: 0.035, descripcion: "IIBB Santiago del Estero - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal SGO" },
      { clave: "iibb_neuquen_general", valor: 0.035, descripcion: "IIBB Neuquén - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal NQN" },
      { clave: "iibb_rionegro_general", valor: 0.035, descripcion: "IIBB Río Negro - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal RN" },
      { clave: "iibb_chubut_general", valor: 0.03, descripcion: "IIBB Chubut - General (3%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal CHU" },
      { clave: "iibb_formosa_general", valor: 0.035, descripcion: "IIBB Formosa - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal FOR" },
      { clave: "iibb_jujuy_general", valor: 0.035, descripcion: "IIBB Jujuy - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal JUJ" },
      { clave: "iibb_catamarca_general", valor: 0.035, descripcion: "IIBB Catamarca - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal CAT" },
      { clave: "iibb_sanluis_general", valor: 0.035, descripcion: "IIBB San Luis - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal SL" },
      { clave: "iibb_sanjuan_general", valor: 0.035, descripcion: "IIBB San Juan - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal SJ" },
      { clave: "iibb_lapampa_general", valor: 0.035, descripcion: "IIBB La Pampa - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal LPA" },
      { clave: "iibb_larioja_general", valor: 0.035, descripcion: "IIBB La Rioja - General (3.5%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal LRJ" },
      { clave: "iibb_santacruz_general", valor: 0.02, descripcion: "IIBB Santa Cruz - General (2%)", categoria: "fiscal", pais: "AR", normativa: "Cód. Fiscal SC" },
      { clave: "iibb_tdf_general", valor: 0, descripcion: "IIBB Tierra del Fuego - General (0% - exento)", categoria: "fiscal", pais: "AR", normativa: "Ley 19.640" },
    ]
  }
  if (pais === "CL") {
    return [
      { clave: "iva_alicuota_general", valor: 19, descripcion: "IVA general Chile", categoria: "fiscal", pais: "CL", normativa: "DL 825" },
    ]
  }
  if (pais === "MX") {
    return [
      { clave: "iva_alicuota_general", valor: 16, descripcion: "IVA general México", categoria: "fiscal", pais: "MX", normativa: "LIVA" },
      { clave: "isr_retencion_servicios", valor: 0.10, descripcion: "Retención ISR servicios 10%", categoria: "fiscal", pais: "MX", normativa: "LISR" },
    ]
  }
  return []
}

/**
 * Retorna los numeradores por defecto.
 */
export function obtenerNumeradoresPorDefecto(): { tipoDocumento: string; prefijo: string; digitos: number }[] {
  return [
    { tipoDocumento: "recibo", prefijo: "REC", digitos: 6 },
    { tipoDocumento: "orden_pago", prefijo: "OP", digitos: 6 },
    { tipoDocumento: "pedido_venta", prefijo: "PV", digitos: 6 },
    { tipoDocumento: "orden_compra", prefijo: "OC", digitos: 6 },
    { tipoDocumento: "remito", prefijo: "REM", digitos: 6 },
    { tipoDocumento: "lista_picking", prefijo: "PK", digitos: 6 },
    { tipoDocumento: "recepcion", prefijo: "RCMP", digitos: 6 },
    { tipoDocumento: "presupuesto", prefijo: "PRES", digitos: 6 },
    { tipoDocumento: "nota_debito", prefijo: "ND", digitos: 6 },
  ]
}
