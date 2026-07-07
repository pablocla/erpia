/**
 * Datos mock realistas (es-AR) para demos embebidas en landings combate.
 * Centralizados para consistencia entre mockups y futuros tests visuales.
 */

export const MOCK_CURRENCY = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

export const MOCK_MONOTRIBUTO = {
  empresa: "Pablo Clavero — Diseño UX",
  cuit: "20-32145678-9",
  categoria: "Factura C",
  trialDias: 11,
  kpis: {
    presupuestoAceptado: 185_000,
    pendienteCobro: 92_500,
    facturasMes: 7,
    avisosWa: 3,
  },
  presupuestos: [
    { id: "pres-42", titulo: "Landing consultora", horas: 40, monto: 185_000, estado: "Aceptado" as const },
    { id: "pres-43", titulo: "Rediseño app móvil", horas: 24, monto: 112_000, estado: "Enviado" as const },
    { id: "pres-44", titulo: "Auditoría UX checkout", horas: 8, monto: 38_000, estado: "Borrador" as const },
  ],
  cobros: [
    { cliente: "TechStart SRL", monto: 92_500, vence: "05/07/2026", mora: 7 },
    { cliente: "Distribuidora Norte", monto: 45_000, vence: "12/07/2026", mora: 0 },
  ],
  clientes: [
    { nombre: "TechStart SRL", cuit: "30-71234567-1", saldo: 92_500 },
    { nombre: "María González", cuit: "27-28456789-3", saldo: 0 },
    { nombre: "Agencia Pixel", cuit: "30-70111222-4", saldo: 18_200 },
  ],
} as const

export const MOCK_SERVICIOS = {
  empresa: "Frío Sur Instalaciones",
  trialDias: 9,
  kpis: {
    turnosHoy: 3,
    presupuestosAbiertos: 5,
    pipeline: 840_000,
    morosos: 2,
  },
  turnos: [
    { id: "t1", hora: "09:00", cliente: "Instalación AC — López", direccion: "Mitre 890, Rosario", estado: "Confirmado" as const },
    { id: "t2", hora: "11:30", cliente: "Mantenimiento — Edificio Sur", direccion: "San Martín 1200", estado: "En camino" as const },
    { id: "t3", hora: "15:00", cliente: "Presupuesto visita", direccion: "Bv. Oroño 450", estado: "Pendiente" as const },
    { id: "t4", hora: "17:30", cliente: "—", direccion: "Hueco libre", estado: "Disponible" as const },
  ],
  presupuestos: [
    { id: "s1", titulo: "Instalación 3 splits", monto: 420_000, estado: "Enviado" },
    { id: "s2", titulo: "Mantenimiento anual", monto: 180_000, estado: "Negociación" },
    { id: "s3", titulo: "Carga de gas + revisión", monto: 95_000, estado: "Aceptado" },
  ],
  morosos: [
    { nombre: "Edificio San Martín", saldo: 68_400, dias: 14 },
    { nombre: "Gimnasio Fit Norte", saldo: 32_100, dias: 8 },
  ],
} as const

export const MOCK_OBRA = {
  obra: "Refacción Mendoza 450",
  semana: 28,
  trialDias: 12,
  kpis: {
    liquidacionViernes: 151_000,
    hitoPendiente: 320_000,
    jornalesSemana: 12,
    obreros: 3,
  },
  obreros: [
    { id: "o1", nombre: "Juan P.", jornales: 5, adelanto: 40_000, neto: 68_000, liquidado: false },
    { id: "o2", nombre: "Miguel R.", jornales: 4, adelanto: 0, neto: 52_000, liquidado: false },
    { id: "o3", nombre: "Carlos D.", jornales: 3, adelanto: 15_000, neto: 31_000, liquidado: false },
  ],
  hitos: [
    { nombre: "Hormigonado losa", monto: 320_000, vence: "10/07/2026", avisado: false },
    { nombre: "Materiales semana 28", monto: 185_000, vence: "15/07/2026", avisado: true },
  ],
} as const

export const MOCK_PROPIEDAD = {
  edificio: "Edificio Rivadavia 1200",
  periodo: "Jul 2026",
  trialDias: 8,
  kpis: {
    liquidacionMes: 122_200,
    morosos: 2,
    unidades: 3,
    portales: 3,
  },
  unidades: [
    { uf: "1° A", inquilino: "María López", expensa: 42_300, estado: "Al día" as const, waEnviado: false },
    { uf: "2° B", inquilino: "Carlos Pérez", expensa: 51_800, estado: "Mora 12d" as const, waEnviado: false },
    { uf: "PB Local", inquilino: "Kiosco Rivadavia", expensa: 28_100, estado: "Mora 5d" as const, waEnviado: true },
  ],
  portales: ["Zonaprop", "Argenprop", "ML Inmuebles"] as const,
  contratos: [
    { uf: "3° C", inquilino: "Ana Martínez", vence: "31/12/2026", garantia: "Depósito $180.000" },
    { uf: "4° D", inquilino: "—", vence: "Disponible", garantia: "—" },
  ],
} as const

export const MOCK_FIADO = {
  empresa: "Almacén Don Diego",
  trialDias: 13,
  cobradoHoy: 4_500,
  deudores: [
    { id: "d1", name: "Don Carlos", saldo: 18_400, limite: 25_000, estado: "Al día" as const },
    { id: "d2", name: "María del Valle", saldo: 12_800, limite: 10_000, estado: "Sobre límite" as const },
    { id: "d3", name: "Ferretería Norte", saldo: 6_200, limite: 15_000, estado: "Mora 3d" as const },
  ],
} as const

export const MOCK_COBRA = {
  empresa: "Distribuidora Demo S.A.",
  trialDias: 10,
  cobradoSemana: 41_200,
  morosos: [
    { id: "m1", name: "Distribuidora Norte", saldo: 84_200, dias: 12, enviado: true },
    { id: "m2", name: "María del Valle", saldo: 18_500, dias: 5, enviado: true },
    { id: "m3", name: "Ferretería Sur", saldo: 32_100, dias: 21, enviado: false },
  ],
} as const

export const MOCK_TURNOS = {
  salon: "Salón Estilo",
  linkPublico: "claver.com.ar/agenda-online/salon-estilo",
  trialDias: 14,
  turnos: [
    { id: "tu1", hora: "10:00", cliente: "Valentina G.", servicio: "Corte + brushing", estado: "Confirmado" as const },
    { id: "tu2", hora: "11:30", cliente: "Lucía M.", servicio: "Coloración", estado: "Confirmado" as const },
    { id: "tu3", hora: "14:00", cliente: "—", servicio: "Hueco libre", estado: "Disponible" as const },
    { id: "tu4", hora: "16:30", cliente: "Carolina R.", servicio: "Manicura", estado: "Recordatorio" as const },
  ],
} as const

export type MockProductSlug =
  | "monotributo"
  | "servicios"
  | "obra"
  | "propiedad"
  | "fiado"
  | "cobra"
  | "turnos"

export const MOCK_TRIAL_DAYS: Record<MockProductSlug, number> = {
  monotributo: MOCK_MONOTRIBUTO.trialDias,
  servicios: MOCK_SERVICIOS.trialDias,
  obra: MOCK_OBRA.trialDias,
  propiedad: MOCK_PROPIEDAD.trialDias,
  fiado: MOCK_FIADO.trialDias,
  cobra: MOCK_COBRA.trialDias,
  turnos: MOCK_TURNOS.trialDias,
}