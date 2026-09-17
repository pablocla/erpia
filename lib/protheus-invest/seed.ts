export type Bank = {
  id: string
  sa6: string
  name: string
  cbu: string
  agencia: string
  cuenta: string
  saldo: number
  pendiente: number
}

/** Z01 — tipos de instrumento. */
export type Instrument = {
  id: string
  desc: string
  renta: "F" | "V" | "M"
  usaApi: boolean
  natCap: string
  natInt: string
}

export type InvestStatus = "activa" | "rescatada" | "cancelada"

/** Z02 — operación de inversión. */
export type Investment = {
  id: string
  tipoId: string
  ticker: string
  nombre: string
  bancoId: string
  agencia: string
  cuenta: string
  capital: number
  cantidad: number
  preCom: number
  tasa: number
  inicio: string
  vence: string
  moneda: 1 | 2
  estado: InvestStatus
  resultado?: number
}

/** Z03 — valuación diaria. */
export type Valuacion = {
  id: string
  investId: string
  fecha: string
  precio: number
  valor: number
  rtoDia: number
  origen: "A" | "C" | "M"
}

/** SE5 vía ExecAuto FINA100. */
export type Asiento = {
  id: string
  investId: string
  fecha: string
  tipo: "ND" | "NC"
  valor: number
  naturaleza: string
  histor: string
  bancoId: string
}

export type Valor = {
  id: string
  tipo: "eCheq" | "Cheque"
  numero: string
  cliente: string
  cuit: string
  bancoId: string
  monto: number
  emision: string
  vence: string
  estado: "cartera" | "depositado" | "descontado" | "rechazado" | "acreditado"
}

export type FiscalLine = {
  id: string
  impuesto: string
  jur: string
  tipo: "percepcion" | "retencion" | "saldo"
  monto: number
  origen: string
  fecha: string
}

export type Cliente = {
  id: string
  nombre: string
  cuit: string
  limite: number
  usado: number
  bcra: 1 | 2 | 3 | 4 | 5
  chequesRechazados: number
  iva: string
  estadoCuit: "activo" | "inactivo"
}

export type Connector = {
  id: string
  name: string
  source: string
  on: boolean
  lastSync?: string
}

export const BANKS: Bank[] = [
  { id: "gal", sa6: "001", name: "Galicia Cta. Cte.", cbu: "0070 0123 0000 0045", agencia: "0123", cuenta: "00000045", saldo: 18_420_000, pendiente: 4_800_000 },
  { id: "san", sa6: "002", name: "Santander Cta. Cte.", cbu: "0072 0088 0000 1190", agencia: "0088", cuenta: "00001190", saldo: 6_150_000, pendiente: 1_200_000 },
  { id: "mp", sa6: "003", name: "Mercado Pago CVU", cbu: "0000 0003 1042 8891", agencia: "00000", cuenta: "10428891", saldo: 2_340_000, pendiente: 890_000 },
]

export const INSTRUMENTS: Instrument[] = [
  { id: "001", desc: "Acciones", renta: "V", usaApi: true, natCap: "INVACC", natInt: "INTACC" },
  { id: "002", desc: "FCI", renta: "V", usaApi: true, natCap: "INVFCI", natInt: "INTFCI" },
  { id: "003", desc: "Plazo fijo", renta: "F", usaApi: false, natCap: "INVPF", natInt: "INTPF" },
  { id: "004", desc: "Letras", renta: "M", usaApi: true, natCap: "INVLET", natInt: "INTLET" },
  { id: "005", desc: "Bonos", renta: "M", usaApi: true, natCap: "INVBON", natInt: "INTBON" },
]

export const INVESTS: Investment[] = [
  {
    id: "INV00001",
    tipoId: "003",
    ticker: "PF-GAL-30D",
    nombre: "Plazo fijo 30d Galicia",
    bancoId: "gal",
    agencia: "0123",
    cuenta: "00000045",
    capital: 12_000_000,
    cantidad: 1,
    preCom: 12_000_000,
    tasa: 38.5,
    inicio: "2026-08-20",
    vence: "2026-09-19",
    moneda: 1,
    estado: "activa",
  },
  {
    id: "INV00002",
    tipoId: "002",
    ticker: "FCI-PREMIU",
    nombre: "FCI money market Galicia",
    bancoId: "gal",
    agencia: "0123",
    cuenta: "00000045",
    capital: 5_500_000,
    cantidad: 55_000,
    preCom: 100,
    tasa: 0,
    inicio: "2026-07-01",
    vence: "",
    moneda: 1,
    estado: "activa",
  },
  {
    id: "INV00003",
    tipoId: "004",
    ticker: "S31O6",
    nombre: "Lecap S31O6",
    bancoId: "san",
    agencia: "0088",
    cuenta: "00001190",
    capital: 3_200_000,
    cantidad: 32_000,
    preCom: 100,
    tasa: 42,
    inicio: "2026-08-01",
    vence: "2026-10-31",
    moneda: 1,
    estado: "activa",
  },
]

export const VALUACIONES: Valuacion[] = [
  { id: "z03-1a", investId: "INV00001", fecha: "2026-09-12", precio: 12_290_959, valor: 12_290_959, rtoDia: 50_630, origen: "C" },
  { id: "z03-1b", investId: "INV00001", fecha: "2026-09-15", precio: 12_329_589, valor: 12_329_589, rtoDia: 38_630, origen: "C" },
  { id: "z03-1c", investId: "INV00001", fecha: "2026-09-16", precio: 12_342_466, valor: 12_342_466, rtoDia: 12_877, origen: "C" },
  { id: "z03-1d", investId: "INV00001", fecha: "2026-09-17", precio: 12_355_342, valor: 12_355_342, rtoDia: 12_876, origen: "C" },
  { id: "z03-2a", investId: "INV00002", fecha: "2026-09-12", precio: 102.4, valor: 5_632_000, rtoDia: 22_000, origen: "A" },
  { id: "z03-2b", investId: "INV00002", fecha: "2026-09-15", precio: 102.55, valor: 5_640_250, rtoDia: 8_250, origen: "A" },
  { id: "z03-2c", investId: "INV00002", fecha: "2026-09-16", precio: 102.68, valor: 5_647_400, rtoDia: 7_150, origen: "A" },
  { id: "z03-2d", investId: "INV00002", fecha: "2026-09-17", precio: 102.81, valor: 5_654_550, rtoDia: 7_150, origen: "A" },
  { id: "z03-3a", investId: "INV00003", fecha: "2026-09-12", precio: 104.1, valor: 3_331_200, rtoDia: 19_200, origen: "A" },
  { id: "z03-3b", investId: "INV00003", fecha: "2026-09-15", precio: 104.4, valor: 3_340_800, rtoDia: 9_600, origen: "A" },
  { id: "z03-3c", investId: "INV00003", fecha: "2026-09-16", precio: 104.55, valor: 3_345_600, rtoDia: 4_800, origen: "A" },
  { id: "z03-3d", investId: "INV00003", fecha: "2026-09-17", precio: 104.72, valor: 3_351_040, rtoDia: 5_440, origen: "A" },
]

export const ASIENTOS: Asiento[] = [
  { id: "se5-1", investId: "INV00001", fecha: "2026-08-20", tipo: "ND", valor: 12_000_000, naturaleza: "INVPF", histor: "Inversion PF-GAL-30D", bancoId: "gal" },
  { id: "se5-2", investId: "INV00002", fecha: "2026-07-01", tipo: "ND", valor: 5_500_000, naturaleza: "INVFCI", histor: "Inversion FCI-PREMIU", bancoId: "gal" },
  { id: "se5-3", investId: "INV00003", fecha: "2026-08-01", tipo: "ND", valor: 3_200_000, naturaleza: "INVLET", histor: "Inversion S31O6", bancoId: "san" },
]

export const VALORES: Valor[] = [
  { id: "v1", tipo: "eCheq", numero: "ECH-88421", cliente: "Metalúrgica Sur SA", cuit: "30-71234567-8", bancoId: "gal", monto: 2_450_000, emision: "2026-09-10", vence: "2026-09-18", estado: "cartera" },
  { id: "v2", tipo: "eCheq", numero: "ECH-88490", cliente: "Distribuidora Norte", cuit: "30-69881234-1", bancoId: "gal", monto: 1_180_000, emision: "2026-09-08", vence: "2026-09-22", estado: "cartera" },
  { id: "v3", tipo: "Cheque", numero: "CH-12011", cliente: "Alimentos Río", cuit: "30-54112233-9", bancoId: "san", monto: 780_000, emision: "2026-09-05", vence: "2026-09-20", estado: "depositado" },
  { id: "v4", tipo: "eCheq", numero: "ECH-87901", cliente: "Logística Andina", cuit: "30-60119988-2", bancoId: "gal", monto: 3_050_000, emision: "2026-08-28", vence: "2026-09-12", estado: "acreditado" },
  { id: "v5", tipo: "eCheq", numero: "ECH-87002", cliente: "Textil Palermo", cuit: "30-55556666-7", bancoId: "mp", monto: 420_000, emision: "2026-09-01", vence: "2026-09-15", estado: "rechazado" },
]

export const FISCAL: FiscalLine[] = [
  { id: "f1", impuesto: "IIBB", jur: "PBA", tipo: "percepcion", monto: 1_240_000, origen: "SIRCREB Galicia", fecha: "2026-09-16" },
  { id: "f2", impuesto: "IIBB", jur: "CABA", tipo: "percepcion", monto: 380_000, origen: "AGIP padrones", fecha: "2026-09-16" },
  { id: "f3", impuesto: "IIBB", jur: "PBA", tipo: "percepcion", monto: 210_000, origen: "SIRCUPA MP", fecha: "2026-09-17" },
  { id: "f4", impuesto: "IVA", jur: "Nación", tipo: "retencion", monto: 540_000, origen: "Pago proveedores", fecha: "2026-09-15" },
  { id: "f5", impuesto: "Ganancias", jur: "Nación", tipo: "retencion", monto: 190_000, origen: "Pago proveedores", fecha: "2026-09-15" },
  { id: "f6", impuesto: "IIBB", jur: "PBA", tipo: "saldo", monto: 4_820_000, origen: "Saldo a favor acumulado", fecha: "2026-09-01" },
]

export const CLIENTES: Cliente[] = [
  { id: "c1", nombre: "Metalúrgica Sur SA", cuit: "30-71234567-8", limite: 8_000_000, usado: 2_450_000, bcra: 1, chequesRechazados: 0, iva: "RI", estadoCuit: "activo" },
  { id: "c2", nombre: "Distribuidora Norte", cuit: "30-69881234-1", limite: 4_000_000, usado: 1_180_000, bcra: 2, chequesRechazados: 1, iva: "RI", estadoCuit: "activo" },
  { id: "c3", nombre: "Textil Palermo", cuit: "30-55556666-7", limite: 1_500_000, usado: 420_000, bcra: 4, chequesRechazados: 3, iva: "RI", estadoCuit: "activo" },
  { id: "c4", nombre: "Servicios del Litoral", cuit: "20-28441122-3", limite: 900_000, usado: 0, bcra: 5, chequesRechazados: 6, iva: "Monotributo", estadoCuit: "inactivo" },
  { id: "c5", nombre: "Alimentos Río", cuit: "30-54112233-9", limite: 3_500_000, usado: 780_000, bcra: 1, chequesRechazados: 0, iva: "RI", estadoCuit: "activo" },
]

export const CONNECTORS: Connector[] = [
  { id: "bcra", name: "BCRA Deudores + cheques", source: "apis.bcra.gob.ar", on: true, lastSync: "2026-09-17 16:40" },
  { id: "arca", name: "ARCA padrón / constancia", source: "Padrones A10 A13", on: true, lastSync: "2026-09-17 08:00" },
  { id: "iibb", name: "Padrones IIBB 24 jur.", source: "ARBA / AGIP / CM", on: true, lastSync: "2026-09-17 07:15" },
  { id: "gal", name: "Extracto Galicia", source: "OFX / home banking", on: true, lastSync: "2026-09-17 09:02" },
  { id: "mpay", name: "Liquidaciones Mercado Pago", source: "API MP", on: true, lastSync: "2026-09-17 14:20" },
  { id: "tc", name: "Tipo de cambio BCRA", source: "Estadísticas cambiarias", on: true, lastSync: "2026-09-17 15:00" },
  { id: "ppi", name: "PPI cotizaciones", source: "API Portfolio Personal · cierre 18:30", on: true, lastSync: "2026-09-16 18:30" },
  { id: "payway", name: "Payway / Getnet", source: "Liquidaciones", on: false },
  { id: "aduana", name: "Despachos / tracking", source: "Aduana + courier", on: false },
]

export const FORECAST = [
  { d: "Hoy", entra: 2.4, sale: 1.1, queda: 26.9 },
  { d: "+7", entra: 6.8, sale: 4.2, queda: 29.5 },
  { d: "+15", entra: 11.2, sale: 9.6, queda: 28.5 },
  { d: "+30", entra: 18.4, sale: 16.1, queda: 29.2 },
]
