/**
 * Parametrization Engine — Seeds initial data per rubro when an empresa is created.
 * 
 * Each rubro (industry vertical) gets:
 * - Module configuration (which modules are enabled)
 * - Default plan de cuentas (chart of accounts)
 * - Default asiento mapping (transaction → account mapping)
 * - Default numeradores (document number sequences)
 * - Default parámetros fiscales
 * - Default tipos de operación comercial
 * - Default clasificaciones fiscales
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE MATRIX PER RUBRO
// ═══════════════════════════════════════════════════════════════════════════════

const MODULOS_POR_RUBRO: Record<string, string[]> = {
  comercio: [
    "ventas", "compras", "stock", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "proveedores", "productos", "precios",
    "cuentas-cobrar", "cuentas-pagar", "cheques", "remitos", "logistica",
    "estadisticas", "configuracion",
  ],
  gastronomia: [
    "ventas", "compras", "stock", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "proveedores", "productos", "precios",
    "cuentas-cobrar", "cuentas-pagar", "hospitalidad", "cocina",
    "estadisticas", "configuracion",
  ],
  industria: [
    "ventas", "compras", "stock", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "proveedores", "productos", "precios",
    "cuentas-cobrar", "cuentas-pagar", "industria", "logistica",
    "picking", "iot", "estadisticas", "configuracion",
  ],
  servicios: [
    "ventas", "compras", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "proveedores", "precios",
    "cuentas-cobrar", "cuentas-pagar", "agenda",
    "estadisticas", "configuracion",
  ],
  salud: [
    "ventas", "compras", "stock", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "proveedores", "productos", "precios",
    "cuentas-cobrar", "cuentas-pagar", "agenda", "historia-clinica",
    "membresias", "estadisticas", "configuracion",
  ],
  veterinaria: [
    "ventas", "compras", "stock", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "proveedores", "productos", "precios",
    "cuentas-cobrar", "cuentas-pagar", "agenda", "historia-clinica",
    "veterinaria", "estadisticas", "configuracion",
  ],
  distribucion: [
    "ventas", "compras", "stock", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "proveedores", "productos", "precios",
    "cuentas-cobrar", "cuentas-pagar", "logistica", "picking",
    "remitos", "envases", "cheques", "comisiones", "vendedores",
    "estadisticas", "configuracion",
  ],
  profesional: [
    "ventas", "caja", "banco", "contabilidad",
    "impuestos", "clientes", "precios",
    "cuentas-cobrar", "agenda",
    "estadisticas", "configuracion",
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN DE CUENTAS PER RUBRO
// ═══════════════════════════════════════════════════════════════════════════════

interface CuentaDef {
  codigo: string
  nombre: string
  tipo: string
  categoria: string
  naturaleza: string
  nivel: number
  imputable: boolean
  ajustaInflacion?: boolean
}

const PLAN_CUENTAS_BASE: CuentaDef[] = [
  // ACTIVO
  { codigo: "1", nombre: "ACTIVO", tipo: "activo", categoria: "Activo", naturaleza: "deudora", nivel: 1, imputable: false },
  { codigo: "1.1", nombre: "ACTIVO CORRIENTE", tipo: "activo", categoria: "Activo Corriente", naturaleza: "deudora", nivel: 2, imputable: false },
  { codigo: "1.1.1", nombre: "Caja", tipo: "activo", categoria: "Disponibilidades", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.2", nombre: "Bancos", tipo: "activo", categoria: "Disponibilidades", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.3", nombre: "Deudores por Ventas", tipo: "activo", categoria: "Créditos por Ventas", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.4", nombre: "Documentos a Cobrar", tipo: "activo", categoria: "Créditos por Ventas", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.5", nombre: "IVA Crédito Fiscal", tipo: "activo", categoria: "Otros Créditos", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.6", nombre: "Retenciones Sufridas IVA", tipo: "activo", categoria: "Otros Créditos", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.7", nombre: "Retenciones Sufridas Ganancias", tipo: "activo", categoria: "Otros Créditos", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.8", nombre: "Retenciones Sufridas IIBB", tipo: "activo", categoria: "Otros Créditos", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.9", nombre: "Percepciones Sufridas IVA", tipo: "activo", categoria: "Otros Créditos", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.1.10", nombre: "Percepciones Sufridas IIBB", tipo: "activo", categoria: "Otros Créditos", naturaleza: "deudora", nivel: 3, imputable: true },
  { codigo: "1.2", nombre: "ACTIVO NO CORRIENTE", tipo: "activo", categoria: "Activo No Corriente", naturaleza: "deudora", nivel: 2, imputable: false },
  { codigo: "1.2.1", nombre: "Bienes de Uso", tipo: "activo", categoria: "Bienes de Uso", naturaleza: "deudora", nivel: 3, imputable: true, ajustaInflacion: true },
  { codigo: "1.2.2", nombre: "Depreciación Acumulada BU", tipo: "activo", categoria: "Bienes de Uso", naturaleza: "acreedora", nivel: 3, imputable: true },

  // PASIVO
  { codigo: "2", nombre: "PASIVO", tipo: "pasivo", categoria: "Pasivo", naturaleza: "acreedora", nivel: 1, imputable: false },
  { codigo: "2.1", nombre: "PASIVO CORRIENTE", tipo: "pasivo", categoria: "Pasivo Corriente", naturaleza: "acreedora", nivel: 2, imputable: false },
  { codigo: "2.1.1", nombre: "Proveedores", tipo: "pasivo", categoria: "Deudas Comerciales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.2", nombre: "IVA Débito Fiscal", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.3", nombre: "IVA a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.4", nombre: "IIBB a Pagar", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.5", nombre: "Retenciones a Depositar IVA", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.6", nombre: "Retenciones a Depositar Ganancias", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.7", nombre: "Retenciones a Depositar IIBB", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.8", nombre: "Percepciones a Depositar IVA", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },
  { codigo: "2.1.9", nombre: "Percepciones a Depositar IIBB", tipo: "pasivo", categoria: "Deudas Fiscales", naturaleza: "acreedora", nivel: 3, imputable: true },

  // PATRIMONIO
  { codigo: "3", nombre: "PATRIMONIO NETO", tipo: "patrimonio", categoria: "Patrimonio", naturaleza: "acreedora", nivel: 1, imputable: false },
  { codigo: "3.1", nombre: "Capital Social", tipo: "patrimonio", categoria: "Capital", naturaleza: "acreedora", nivel: 2, imputable: true },
  { codigo: "3.2", nombre: "Resultados Acumulados", tipo: "patrimonio", categoria: "Resultados", naturaleza: "acreedora", nivel: 2, imputable: true },
  { codigo: "3.3", nombre: "Resultado del Ejercicio", tipo: "patrimonio", categoria: "Resultado del Ejercicio", naturaleza: "acreedora", nivel: 2, imputable: true },

  // INGRESOS
  { codigo: "4", nombre: "INGRESOS", tipo: "ingreso", categoria: "Ingresos", naturaleza: "acreedora", nivel: 1, imputable: false },
  { codigo: "4.1", nombre: "Ventas", tipo: "ingreso", categoria: "Ventas", naturaleza: "acreedora", nivel: 2, imputable: true },
  { codigo: "4.2", nombre: "Intereses Ganados", tipo: "ingreso", categoria: "Ingresos Financieros", naturaleza: "acreedora", nivel: 2, imputable: true },
  { codigo: "4.3", nombre: "Otros Ingresos", tipo: "ingreso", categoria: "Otros Ingresos", naturaleza: "acreedora", nivel: 2, imputable: true },

  // EGRESOS
  { codigo: "5", nombre: "EGRESOS", tipo: "egreso", categoria: "Egresos", naturaleza: "deudora", nivel: 1, imputable: false },
  { codigo: "5.1", nombre: "Costo de Mercadería Vendida", tipo: "egreso", categoria: "CMV", naturaleza: "deudora", nivel: 2, imputable: true },
  { codigo: "5.2", nombre: "Gastos de Administración", tipo: "egreso", categoria: "Gastos Admin", naturaleza: "deudora", nivel: 2, imputable: true },
  { codigo: "5.3", nombre: "Gastos de Comercialización", tipo: "egreso", categoria: "Gastos Comerciales", naturaleza: "deudora", nivel: 2, imputable: true },
  { codigo: "5.4", nombre: "Gastos Financieros", tipo: "egreso", categoria: "Gastos Financieros", naturaleza: "deudora", nivel: 2, imputable: true },
  { codigo: "5.5", nombre: "Depreciación Bienes de Uso", tipo: "egreso", categoria: "Depreciaciones", naturaleza: "deudora", nivel: 2, imputable: true },
]

// Cuentas extra por rubro
const CUENTAS_EXTRA_RUBRO: Record<string, CuentaDef[]> = {
  comercio: [
    { codigo: "1.1.11", nombre: "Mercaderías", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true, ajustaInflacion: true },
  ],
  gastronomia: [
    { codigo: "1.1.11", nombre: "Mercaderías - Insumos", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "4.1.1", nombre: "Ventas Gastronómicas", tipo: "ingreso", categoria: "Ventas", naturaleza: "acreedora", nivel: 3, imputable: true },
    { codigo: "5.1.1", nombre: "Costo Insumos Gastronomía", tipo: "egreso", categoria: "CMV", naturaleza: "deudora", nivel: 3, imputable: true },
  ],
  industria: [
    { codigo: "1.1.11", nombre: "Materias Primas", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "1.1.12", nombre: "Productos en Proceso", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "1.1.13", nombre: "Productos Terminados", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "5.1.1", nombre: "Costo de Producción", tipo: "egreso", categoria: "CMV", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "5.6", nombre: "Mano de Obra Directa", tipo: "egreso", categoria: "Producción", naturaleza: "deudora", nivel: 2, imputable: true },
    { codigo: "5.7", nombre: "Gastos Indirectos Fabricación", tipo: "egreso", categoria: "Producción", naturaleza: "deudora", nivel: 2, imputable: true },
  ],
  servicios: [
    { codigo: "4.1.1", nombre: "Ingresos por Servicios", tipo: "ingreso", categoria: "Ventas", naturaleza: "acreedora", nivel: 3, imputable: true },
    { codigo: "5.6", nombre: "Gastos de Personal", tipo: "egreso", categoria: "Gastos Personal", naturaleza: "deudora", nivel: 2, imputable: true },
  ],
  salud: [
    { codigo: "1.1.11", nombre: "Insumos Médicos", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "4.1.1", nombre: "Ingresos por Consultas", tipo: "ingreso", categoria: "Ventas", naturaleza: "acreedora", nivel: 3, imputable: true },
    { codigo: "4.1.2", nombre: "Ingresos por Membresías", tipo: "ingreso", categoria: "Ventas", naturaleza: "acreedora", nivel: 3, imputable: true },
  ],
  veterinaria: [
    { codigo: "1.1.11", nombre: "Medicamentos Veterinarios", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "4.1.1", nombre: "Ingresos por Consultas", tipo: "ingreso", categoria: "Ventas", naturaleza: "acreedora", nivel: 3, imputable: true },
    { codigo: "4.1.2", nombre: "Ingresos por Cirugías", tipo: "ingreso", categoria: "Ventas", naturaleza: "acreedora", nivel: 3, imputable: true },
    { codigo: "5.1.1", nombre: "Costo Medicamentos", tipo: "egreso", categoria: "CMV", naturaleza: "deudora", nivel: 3, imputable: true },
  ],
  distribucion: [
    { codigo: "1.1.11", nombre: "Mercaderías", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "1.1.12", nombre: "Envases Retornables (activo)", tipo: "activo", categoria: "Bienes de Cambio", naturaleza: "deudora", nivel: 3, imputable: true },
    { codigo: "5.6", nombre: "Gastos de Distribución", tipo: "egreso", categoria: "Logística", naturaleza: "deudora", nivel: 2, imputable: true },
    { codigo: "5.7", nombre: "Comisiones Vendedores", tipo: "egreso", categoria: "Gastos Comerciales", naturaleza: "deudora", nivel: 2, imputable: true },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASIENTO CONFIG PER RUBRO
// ═══════════════════════════════════════════════════════════════════════════════

interface AsientoMapDef {
  tipoTransaccion: string
  campo: string
  cuentaCodigo: string
  cuentaNombre: string
}

const ASIENTO_MAP_BASE: AsientoMapDef[] = [
  { tipoTransaccion: "venta", campo: "ingreso", cuentaCodigo: "4.1", cuentaNombre: "Ventas" },
  { tipoTransaccion: "venta", campo: "iva_df", cuentaCodigo: "2.1.2", cuentaNombre: "IVA Débito Fiscal" },
  { tipoTransaccion: "venta", campo: "deudores", cuentaCodigo: "1.1.3", cuentaNombre: "Deudores por Ventas" },
  { tipoTransaccion: "venta", campo: "caja", cuentaCodigo: "1.1.1", cuentaNombre: "Caja" },
  { tipoTransaccion: "compra", campo: "mercaderia", cuentaCodigo: "1.1.11", cuentaNombre: "Mercaderías" },
  { tipoTransaccion: "compra", campo: "iva_cf", cuentaCodigo: "1.1.5", cuentaNombre: "IVA Crédito Fiscal" },
  { tipoTransaccion: "compra", campo: "proveedores", cuentaCodigo: "2.1.1", cuentaNombre: "Proveedores" },
  { tipoTransaccion: "cobro", campo: "caja", cuentaCodigo: "1.1.1", cuentaNombre: "Caja" },
  { tipoTransaccion: "cobro", campo: "banco", cuentaCodigo: "1.1.2", cuentaNombre: "Bancos" },
  { tipoTransaccion: "cobro", campo: "deudores", cuentaCodigo: "1.1.3", cuentaNombre: "Deudores por Ventas" },
  { tipoTransaccion: "cobro", campo: "ret_iva_sufrida", cuentaCodigo: "1.1.6", cuentaNombre: "Retenciones Sufridas IVA" },
  { tipoTransaccion: "cobro", campo: "ret_ganancias_sufrida", cuentaCodigo: "1.1.7", cuentaNombre: "Retenciones Sufridas Ganancias" },
  { tipoTransaccion: "cobro", campo: "ret_iibb_sufrida", cuentaCodigo: "1.1.8", cuentaNombre: "Retenciones Sufridas IIBB" },
  { tipoTransaccion: "pago", campo: "proveedores", cuentaCodigo: "2.1.1", cuentaNombre: "Proveedores" },
  { tipoTransaccion: "pago", campo: "caja", cuentaCodigo: "1.1.1", cuentaNombre: "Caja" },
  { tipoTransaccion: "pago", campo: "banco", cuentaCodigo: "1.1.2", cuentaNombre: "Bancos" },
  { tipoTransaccion: "pago", campo: "ret_iva_depositar", cuentaCodigo: "2.1.5", cuentaNombre: "Retenciones a Depositar IVA" },
  { tipoTransaccion: "pago", campo: "ret_ganancias_depositar", cuentaCodigo: "2.1.6", cuentaNombre: "Retenciones a Depositar Ganancias" },
  { tipoTransaccion: "pago", campo: "ret_iibb_depositar", cuentaCodigo: "2.1.7", cuentaNombre: "Retenciones a Depositar IIBB" },
  { tipoTransaccion: "cmv", campo: "cmv", cuentaCodigo: "5.1", cuentaNombre: "Costo de Mercadería Vendida" },
  { tipoTransaccion: "cmv", campo: "mercaderia", cuentaCodigo: "1.1.11", cuentaNombre: "Mercaderías" },
  { tipoTransaccion: "liquidacion_iva", campo: "iva_df", cuentaCodigo: "2.1.2", cuentaNombre: "IVA Débito Fiscal" },
  { tipoTransaccion: "liquidacion_iva", campo: "iva_cf", cuentaCodigo: "1.1.5", cuentaNombre: "IVA Crédito Fiscal" },
  { tipoTransaccion: "liquidacion_iva", campo: "iva_a_pagar", cuentaCodigo: "2.1.3", cuentaNombre: "IVA a Pagar" },
]

// ═══════════════════════════════════════════════════════════════════════════════
// NUMERADORES
// ═══════════════════════════════════════════════════════════════════════════════

const NUMERADORES_BASE = [
  { tipoDocumento: "recibo", prefijo: "REC", digitos: 6 },
  { tipoDocumento: "orden_pago", prefijo: "OP", digitos: 6 },
  { tipoDocumento: "pedido_venta", prefijo: "PV", digitos: 6 },
  { tipoDocumento: "orden_compra", prefijo: "OC", digitos: 6 },
  { tipoDocumento: "remito", prefijo: "REM", digitos: 8 },
  { tipoDocumento: "lista_picking", prefijo: "PK", digitos: 6 },
  { tipoDocumento: "recepcion", prefijo: "RCMP", digitos: 6 },
  { tipoDocumento: "nota_debito", prefijo: "ND", digitos: 8 },
  { tipoDocumento: "presupuesto", prefijo: "PRES", digitos: 6 },
]

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT PARAMETROS FISCALES
// ═══════════════════════════════════════════════════════════════════════════════

const PARAMETROS_FISCALES_DEFAULT = [
  { clave: "iva_general", valor: 21, descripcion: "Alícuota IVA general", categoria: "fiscal", normativa: "Ley 23.349" },
  { clave: "iva_reducido", valor: 10.5, descripcion: "Alícuota IVA reducido", categoria: "fiscal", normativa: "Ley 23.349" },
  { clave: "iva_diferencial", valor: 27, descripcion: "Alícuota IVA diferencial (energía/telecom)", categoria: "fiscal", normativa: "Ley 23.349" },
  { clave: "umbral_rg5824", valor: 400000, descripcion: "Umbral RG 5824 para solicitud CAE", categoria: "fiscal", normativa: "RG 5824/2026" },
  { clave: "tolerancia_3way_match", valor: 2, descripcion: "Tolerancia % para 3-way matching", categoria: "operativo" },
  { clave: "minimo_sicore_305", valor: 20000, descripcion: "Mínimo no sujeto a retención SICORE 305", categoria: "fiscal", normativa: "RG 830" },
  { clave: "minimo_sicore_767", valor: 45000, descripcion: "Mínimo no sujeto retención Ganancias", categoria: "fiscal", normativa: "RG 830" },
  { clave: "ret_iva_inscripto", valor: 50, descripcion: "% retención IVA inscriptos", categoria: "fiscal", normativa: "RG 2854" },
  { clave: "ret_iva_no_inscripto", valor: 100, descripcion: "% retención IVA no inscriptos", categoria: "fiscal", normativa: "RG 2854" },
]

// ═══════════════════════════════════════════════════════════════════════════════
// CLASIFICACIONES FISCALES DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

const CLASIFICACIONES_FISCALES_DEFAULT = [
  { codigo: "GRAV_21", nombre: "Gravado 21%", alicuotaIva: 21, exentoIva: false, noGravado: false },
  { codigo: "GRAV_10_5", nombre: "Gravado 10.5%", alicuotaIva: 10.5, exentoIva: false, noGravado: false },
  { codigo: "GRAV_27", nombre: "Gravado 27%", alicuotaIva: 27, exentoIva: false, noGravado: false },
  { codigo: "EXENTO", nombre: "Exento de IVA", alicuotaIva: 0, exentoIva: true, noGravado: false },
  { codigo: "NO_GRAVADO", nombre: "No Gravado", alicuotaIva: 0, exentoIva: false, noGravado: true },
]

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE COMPROBANTE AFIP
// ═══════════════════════════════════════════════════════════════════════════════

const TIPOS_COMPROBANTE_AFIP = [
  { codigoAfip: 1, letra: "A", nombre: "Factura A", abreviatura: "FA", esFactura: true },
  { codigoAfip: 2, letra: "A", nombre: "Nota de Débito A", abreviatura: "NDA", esNotaDebito: true },
  { codigoAfip: 3, letra: "A", nombre: "Nota de Crédito A", abreviatura: "NCA", esNotaCredito: true },
  { codigoAfip: 6, letra: "B", nombre: "Factura B", abreviatura: "FB", esFactura: true },
  { codigoAfip: 7, letra: "B", nombre: "Nota de Débito B", abreviatura: "NDB", esNotaDebito: true },
  { codigoAfip: 8, letra: "B", nombre: "Nota de Crédito B", abreviatura: "NCB", esNotaCredito: true },
  { codigoAfip: 11, letra: "C", nombre: "Factura C", abreviatura: "FC", esFactura: true },
  { codigoAfip: 12, letra: "C", nombre: "Nota de Débito C", abreviatura: "NDC", esNotaDebito: true },
  { codigoAfip: 13, letra: "C", nombre: "Nota de Crédito C", abreviatura: "NCC", esNotaCredito: true },
  { codigoAfip: 19, letra: "E", nombre: "Factura de Exportación E", abreviatura: "FE", esFactura: true },
  { codigoAfip: 20, letra: "E", nombre: "Nota de Débito Exportación E", abreviatura: "NDE", esNotaDebito: true },
  { codigoAfip: 21, letra: "E", nombre: "Nota de Crédito Exportación E", abreviatura: "NCE", esNotaCredito: true },
  { codigoAfip: 201, letra: "A", nombre: "Factura de Crédito Electrónica MiPyME A", abreviatura: "FCEA", esFactura: true, esFCE: true },
  { codigoAfip: 206, letra: "B", nombre: "Factura de Crédito Electrónica MiPyME B", abreviatura: "FCEB", esFactura: true, esFCE: true },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PARAMETRIZATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export async function parametrizarEmpresa(empresaId: number, rubro: string): Promise<void> {
  const rubroKey = rubro.toLowerCase().replace(/\s+/g, "_")
  console.log(`\n📦 Parametrizando empresa ${empresaId} (rubro: ${rubroKey})...`)

  // 1. Module configuration
  const modulos = MODULOS_POR_RUBRO[rubroKey] ?? MODULOS_POR_RUBRO.comercio!
  for (const modulo of modulos) {
    await prisma.configuracionModulo.upsert({
      where: { empresaId_modulo: { empresaId, modulo } },
      update: { habilitado: true },
      create: { empresaId, modulo, habilitado: true },
    })
  }
  console.log(`  ✓ ${modulos.length} módulos habilitados`)

  // 2. Plan de cuentas
  const cuentas = [...PLAN_CUENTAS_BASE, ...(CUENTAS_EXTRA_RUBRO[rubroKey] ?? [])]
  for (const cuenta of cuentas) {
    await prisma.cuentaContable.upsert({
      where: { empresaId_codigo: { empresaId, codigo: cuenta.codigo } },
      update: { nombre: cuenta.nombre },
      create: {
        empresaId,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        categoria: cuenta.categoria,
        naturaleza: cuenta.naturaleza,
        nivel: cuenta.nivel,
        imputable: cuenta.imputable,
        ajustaInflacion: cuenta.ajustaInflacion ?? false,
      },
    })
  }
  console.log(`  ✓ ${cuentas.length} cuentas contables`)

  // 3. Asiento config
  for (const map of ASIENTO_MAP_BASE) {
    await prisma.configAsientoCuenta.upsert({
      where: {
        empresaId_tipoTransaccion_campo: {
          empresaId,
          tipoTransaccion: map.tipoTransaccion,
          campo: map.campo,
        },
      },
      update: { cuentaCodigo: map.cuentaCodigo, cuentaNombre: map.cuentaNombre },
      create: {
        empresaId,
        tipoTransaccion: map.tipoTransaccion,
        campo: map.campo,
        cuentaCodigo: map.cuentaCodigo,
        cuentaNombre: map.cuentaNombre,
      },
    })
  }
  console.log(`  ✓ ${ASIENTO_MAP_BASE.length} mapeos de asientos`)

  // 4. Numeradores
  for (const num of NUMERADORES_BASE) {
    await prisma.numerador.upsert({
      where: {
        empresaId_tipoDocumento_sucursal: {
          empresaId,
          tipoDocumento: num.tipoDocumento,
          sucursal: "0001",
        },
      },
      update: {},
      create: {
        empresaId,
        tipoDocumento: num.tipoDocumento,
        prefijo: num.prefijo,
        digitos: num.digitos,
        sucursal: "0001",
      },
    })
  }
  console.log(`  ✓ ${NUMERADORES_BASE.length} numeradores`)

  // 5. Parámetros fiscales
  for (const param of PARAMETROS_FISCALES_DEFAULT) {
    await prisma.parametroFiscal.upsert({
      where: {
        empresaId_clave_pais: { empresaId, clave: param.clave, pais: "AR" },
      },
      update: { valor: param.valor },
      create: {
        empresaId,
        clave: param.clave,
        valor: param.valor,
        descripcion: param.descripcion,
        categoria: param.categoria,
        pais: "AR",
        normativa: param.normativa,
      },
    })
  }
  console.log(`  ✓ ${PARAMETROS_FISCALES_DEFAULT.length} parámetros fiscales`)

  // 6. Clasificaciones fiscales
  for (const clf of CLASIFICACIONES_FISCALES_DEFAULT) {
    await prisma.clasificacionFiscal.upsert({
      where: { codigo: clf.codigo },
      update: {},
      create: clf,
    })
  }
  console.log(`  ✓ ${CLASIFICACIONES_FISCALES_DEFAULT.length} clasificaciones fiscales`)

  // 7. Tipos de comprobante AFIP
  for (const tc of TIPOS_COMPROBANTE_AFIP) {
    await prisma.tipoComprobanteMaestro.upsert({
      where: { empresaId_codigoAfip: { empresaId, codigoAfip: tc.codigoAfip } },
      update: {},
      create: {
        empresaId,
        codigoAfip: tc.codigoAfip,
        letra: tc.letra,
        nombre: tc.nombre,
        abreviatura: tc.abreviatura,
        esFactura: tc.esFactura ?? false,
        esNotaCredito: tc.esNotaCredito ?? false,
        esNotaDebito: tc.esNotaDebito ?? false,
        esFCE: tc.esFCE ?? false,
      },
    })
  }
  console.log(`  ✓ ${TIPOS_COMPROBANTE_AFIP.length} tipos de comprobante AFIP`)

  // 8. Config fiscal empresa
  await prisma.configFiscalEmpresa.upsert({
    where: { empresaId },
    update: {},
    create: {
      empresaId,
      esAgentePercepcionIVA: false,
      esAgenteRetencionIVA: false,
      esAgentePercepcionIIBB: false,
      esAgenteRetencionIIBB: false,
      esAgenteRetencionGanancias: false,
    },
  })
  console.log(`  ✓ Config fiscal empresa`)

  // 9. Sucursal principal
  await prisma.sucursal.upsert({
    where: { empresaId_codigo: { empresaId, codigo: "CASA_CENTRAL" } },
    update: {},
    create: {
      empresaId,
      codigo: "CASA_CENTRAL",
      nombre: "Casa Central",
      esMatriz: true,
    },
  })
  console.log(`  ✓ Sucursal principal creada`)

  // 10. Depósito principal
  await prisma.deposito.upsert({
    where: { id: -1 }, // Force create
    update: {},
    create: {
      empresaId,
      codigo: "DEP_PRINCIPAL",
      nombre: "Depósito Principal",
      tipo: "principal",
    },
  }).catch(() => {
    // If already exists, ignore
  })
  console.log(`  ✓ Depósito principal`)

  console.log(`✅ Parametrización completada para empresa ${empresaId} (${rubroKey})\n`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// API: Can be called from onboarding or admin panel
// ═══════════════════════════════════════════════════════════════════════════════

export { MODULOS_POR_RUBRO, PLAN_CUENTAS_BASE, CUENTAS_EXTRA_RUBRO }
