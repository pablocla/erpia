export interface Cuenta {
  codigo: string
  nombre: string
  tipo: "activo" | "pasivo" | "patrimonio" | "ingreso" | "egreso"
  categoria: string
}

export const PLAN_CUENTAS: Cuenta[] = [
  // ACTIVO
  { codigo: "1.1", nombre: "Caja", tipo: "activo", categoria: "Disponibilidades" },
  { codigo: "1.2", nombre: "Banco Cuenta Corriente", tipo: "activo", categoria: "Disponibilidades" },
  { codigo: "1.3", nombre: "Banco Caja de Ahorro", tipo: "activo", categoria: "Disponibilidades" },
  { codigo: "1.4", nombre: "Mercaderías", tipo: "activo", categoria: "Bienes de Cambio" },
  { codigo: "1.5", nombre: "Clientes", tipo: "activo", categoria: "Créditos" },
  { codigo: "1.6", nombre: "IVA Crédito Fiscal", tipo: "activo", categoria: "Créditos Fiscales" },

  // PASIVO
  { codigo: "2.1", nombre: "Proveedores", tipo: "pasivo", categoria: "Deudas Comerciales" },
  { codigo: "2.2", nombre: "IVA Débito Fiscal", tipo: "pasivo", categoria: "Deudas Fiscales" },
  { codigo: "2.3", nombre: "Sueldos a Pagar", tipo: "pasivo", categoria: "Deudas Sociales" },
  { codigo: "2.4", nombre: "Cargas Sociales a Pagar", tipo: "pasivo", categoria: "Deudas Sociales" },

  // PATRIMONIO NETO
  { codigo: "3.1", nombre: "Capital", tipo: "patrimonio", categoria: "Capital" },
  { codigo: "3.2", nombre: "Resultados Acumulados", tipo: "patrimonio", categoria: "Resultados" },

  // INGRESOS
  { codigo: "4.1", nombre: "Ventas", tipo: "ingreso", categoria: "Ingresos Operativos" },
  { codigo: "4.2", nombre: "Intereses Ganados", tipo: "ingreso", categoria: "Ingresos Financieros" },
  { codigo: "4.3", nombre: "Otros Ingresos", tipo: "ingreso", categoria: "Ingresos Varios" },

  // EGRESOS
  { codigo: "5.1", nombre: "Costo de Mercaderías Vendidas", tipo: "egreso", categoria: "Costos" },
  { codigo: "5.2", nombre: "Gastos de Administración", tipo: "egreso", categoria: "Gastos Operativos" },
  { codigo: "5.3", nombre: "Gastos de Comercialización", tipo: "egreso", categoria: "Gastos Operativos" },
  { codigo: "5.4", nombre: "Sueldos y Jornales", tipo: "egreso", categoria: "Gastos de Personal" },
  { codigo: "5.5", nombre: "Cargas Sociales", tipo: "egreso", categoria: "Gastos de Personal" },
  { codigo: "5.6", nombre: "Alquileres", tipo: "egreso", categoria: "Gastos Operativos" },
  { codigo: "5.7", nombre: "Servicios Públicos", tipo: "egreso", categoria: "Gastos Operativos" },
  { codigo: "5.8", nombre: "Intereses Perdidos", tipo: "egreso", categoria: "Gastos Financieros" },
]

export function obtenerCuenta(codigo: string): Cuenta | undefined {
  return PLAN_CUENTAS.find((c) => c.codigo === codigo)
}

export function obtenerCuentasPorTipo(tipo: Cuenta["tipo"]): Cuenta[] {
  return PLAN_CUENTAS.filter((c) => c.tipo === tipo)
}
