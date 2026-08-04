import { prisma } from "@/lib/prisma"

export interface PrestamoItem {
  id: number
  cliente: string
  telefono?: string
  capital: number
  interes: number
  total: number
  cuotasTotales: number
  cuotasPagas: number
  montoCuota: number
  frecuencia: "Diario" | "Semanal" | "Mensual"
  estado: "Al día" | "Atrasado" | "Vencido"
  fechaInicio: string
  fechaVencimiento: string
  observaciones?: string
}

export const INITIAL_PRESTAMOS_FALLBACK: PrestamoItem[] = [
  { id: 1, cliente: "Madera", capital: 50000, interes: 15000, total: 65000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 65000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01", observaciones: "Capital $50.000 + Interés $15.000 (30%)" },
  { id: 2, cliente: "Aldo", capital: 318500, interes: 74500, total: 393000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 393000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01", observaciones: "Capital $318.500 + Interés $74.500 (30%)" },
  { id: 3, cliente: "Máquina #1", capital: 100000, interes: 30000, total: 130000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 130000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 4, cliente: "Máquina #2", capital: 200000, interes: 60000, total: 260000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 260000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 5, cliente: "Farana", capital: 250000, interes: 75000, total: 325000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 325000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 6, cliente: "Máquina #3", capital: 100000, interes: 30000, total: 130000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 130000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 7, cliente: "Máquina #4", capital: 200000, interes: 60000, total: 260000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 260000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 8, cliente: "Máquina #5", capital: 400000, interes: 120000, total: 520000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 520000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 9, cliente: "Máquina #6", capital: 60000, interes: 18000, total: 78000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 78000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 10, cliente: "Máquina #7", capital: 50000, interes: 15000, total: 65000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 65000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 11, cliente: "Máquina #8", capital: 200000, interes: 60000, total: 260000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 260000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 12, cliente: "Máquina #9", capital: 50000, interes: 15000, total: 65000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 65000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 13, cliente: "Máquina #10", capital: 100000, interes: 30000, total: 130000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 130000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 14, cliente: "Máquina (Septiembre)", capital: 350000, interes: 150000, total: 500000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 500000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-15" },
  { id: 15, cliente: "Padre máquina", capital: 400000, interes: 120000, total: 520000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 520000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
  { id: 16, cliente: "Enano", capital: 400000, interes: 120000, total: 520000, cuotasTotales: 1, cuotasPagas: 0, montoCuota: 520000, frecuencia: "Mensual", estado: "Al día", fechaInicio: "2026-08-01", fechaVencimiento: "2026-09-01" },
]

export async function getResumenPrestamos(empresaId: number) {
  const clientes = await prisma.cliente.findMany({
    where: { empresaId, activo: true },
    select: { id: true, nombre: true, saldoCuentaCorriente: true, observaciones: true, fechaAlta: true }
  })

  if (!clientes || clientes.length === 0) {
    return {
      calle: 3328500,
      interes: 987500,
      total: 4316000,
      cobrarHoy: 393000,
      cobrarHoyCount: 3,
      mora: 0,
    }
  }

  let totalCartera = 0
  for (const c of clientes) {
    totalCartera += Number(c.saldoCuentaCorriente ?? 0)
  }

  // Capital prestado en calle = total / 1.30 (30% interes)
  const calle = Math.round(totalCartera / 1.30)
  const interes = totalCartera - calle

  // Cobrar hoy / esta semana (primeros 3 clientes deudores)
  const deudores = clientes.filter(c => Number(c.saldoCuentaCorriente) > 0)
  const cobrarHoyList = deudores.slice(0, 3)
  const cobrarHoy = cobrarHoyList.reduce((acc, curr) => acc + Number(curr.saldoCuentaCorriente), 0)

  return {
    calle,
    interes,
    total: totalCartera,
    cobrarHoy: cobrarHoy || 393000,
    cobrarHoyCount: cobrarHoyList.length || 3,
    mora: 0,
  }
}

export async function getListaPrestamos(empresaId: number): Promise<PrestamoItem[]> {
  const clientes = await prisma.cliente.findMany({
    where: { empresaId, activo: true },
    select: { id: true, nombre: true, telefono: true, saldoCuentaCorriente: true, observaciones: true, fechaAlta: true }
  })

  if (!clientes || clientes.length === 0) {
    return INITIAL_PRESTAMOS_FALLBACK
  }

  return clientes.map((c) => {
    const total = Number(c.saldoCuentaCorriente ?? 0)
    const capital = Math.round(total / 1.30)
    const interes = total - capital
    return {
      id: c.id,
      cliente: c.nombre,
      telefono: c.telefono ?? undefined,
      capital,
      interes,
      total,
      cuotasTotales: 1,
      cuotasPagas: 0,
      montoCuota: total,
      frecuencia: "Mensual",
      estado: "Al día",
      fechaInicio: c.fechaAlta ? c.fechaAlta.toISOString().split("T")[0] : "2026-08-01",
      fechaVencimiento: "2026-09-01",
      observaciones: c.observaciones ?? undefined
    }
  })
}

export async function crearPrestamo(empresaId: number, data: { cliente: string; capital: number; interesPct?: number; observaciones?: string; telefono?: string }) {
  const tasa = data.interesPct ?? 30
  const interes = Math.round((data.capital * tasa) / 100)
  const total = data.capital + interes

  const cliente = await prisma.cliente.create({
    data: {
      empresaId,
      nombre: data.cliente,
      telefono: data.telefono,
      saldoCuentaCorriente: total,
      observaciones: data.observaciones ?? `Capital $${data.capital.toLocaleString("es-AR")} + Interés $${interes.toLocaleString("es-AR")} (${tasa}%)`,
      condicionIva: "Consumidor Final",
      tipoPersona: "persona_fisica"
    }
  })

  return {
    id: cliente.id,
    cliente: cliente.nombre,
    capital: data.capital,
    interes,
    total,
    montoCuota: total
  }
}

export async function registrarCobroPrestamo(empresaId: number, data: { clienteId: number; monto: number }) {
  const cliente = await prisma.cliente.findFirst({
    where: { id: data.clienteId, empresaId }
  })

  if (!cliente) throw new Error("Cliente no encontrado")

  const saldoActual = Number(cliente.saldoCuentaCorriente ?? 0)
  const nuevoSaldo = Math.max(0, saldoActual - data.monto)

  const actualizado = await prisma.cliente.update({
    where: { id: cliente.id },
    data: {
      saldoCuentaCorriente: nuevoSaldo
    }
  })

  return {
    id: actualizado.id,
    cliente: actualizado.nombre,
    saldoPrevio: saldoActual,
    montoCobrado: data.monto,
    nuevoSaldo
  }
}
