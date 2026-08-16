import { prisma } from "@/lib/prisma"
import {
  buildMetaOnCreate,
  cobrosDeHoy,
  estadoDesdeVencimiento,
  extractMetaBlock,
  inferMetaFromLegacy,
  isCobrarHoy,
  serializeObservaciones,
  type MedioCobro,
  type PrestamoMeta,
  type CobroPrestamo,
} from "./prestamos-meta"

export interface PrestamoItem {
  id: number
  cliente: string
  telefono?: string
  capital: number
  interes: number
  interesPct: number
  /** Saldo actual a cobrar */
  total: number
  totalOriginal: number
  montoCuota: number
  cuotasTotales: number
  cuotasPagas: number
  frecuencia: "Diario" | "Semanal" | "Mensual"
  estado: "Al día" | "Vence hoy" | "Vencido" | "Saldado" | "Atrasado"
  fechaInicio: string
  fechaVencimiento: string
  observaciones?: string
  notas?: string
  cobros: CobroPrestamo[]
  cobrarHoy: boolean
  cobradoHoy: number
}

export interface ResumenPrestamos {
  total: number
  cantidadDeudores: number
  cobrarHoy: number
  cobrarHoyCount: number
  cobradoHoy: number
  vencidos: number
  vencidosCount: number
}

function mapClienteToItem(c: {
  id: number
  nombre: string
  telefono: string | null
  saldoCuentaCorriente: unknown
  observaciones: string | null
  fechaAlta: Date | null
}): PrestamoItem {
  const saldo = Math.max(0, Number(c.saldoCuentaCorriente ?? 0))
  const { meta: parsed, notas } = extractMetaBlock(c.observaciones)
  const meta =
    parsed ??
    inferMetaFromLegacy({
      saldo,
      observaciones: c.observaciones,
      fechaAlta: c.fechaAlta,
    })

  const estado = estadoDesdeVencimiento(saldo, meta.fechaVencimiento)
  const cobradoHoy = cobrosDeHoy(meta.cobros).reduce((s, x) => s + x.monto, 0)

  return {
    id: c.id,
    cliente: c.nombre,
    telefono: c.telefono ?? undefined,
    capital: meta.capital,
    interes: meta.interes,
    interesPct: meta.interesPct,
    total: saldo,
    totalOriginal: meta.totalOriginal || meta.capital + meta.interes,
    montoCuota: saldo,
    cuotasTotales: 1,
    cuotasPagas: saldo <= 0 ? 1 : 0,
    frecuencia: "Mensual",
    estado: estado === "Vencido" ? "Vencido" : estado === "Vence hoy" ? "Vence hoy" : estado === "Saldado" ? "Saldado" : "Al día",
    fechaInicio: c.fechaAlta ? c.fechaAlta.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    fechaVencimiento: meta.fechaVencimiento,
    observaciones: c.observaciones ?? undefined,
    notas: notas || undefined,
    cobros: meta.cobros,
    cobrarHoy: isCobrarHoy(saldo, meta.fechaVencimiento),
    cobradoHoy,
  }
}

async function loadClientes(empresaId: number) {
  return prisma.cliente.findMany({
    where: { empresaId, activo: true, deletedAt: null },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      saldoCuentaCorriente: true,
      observaciones: true,
      fechaAlta: true,
    },
    orderBy: { nombre: "asc" },
  })
}

/** Cartera con saldo > 0 (prestamista casero). */
export async function getListaPrestamos(empresaId: number): Promise<PrestamoItem[]> {
  const clientes = await loadClientes(empresaId)
  return clientes
    .map(mapClienteToItem)
    .filter((p) => p.total > 0)
    .sort((a, b) => {
      // Vencidos primero, luego vence hoy, luego por saldo desc
      const rank = (e: string) => (e === "Vencido" ? 0 : e === "Vence hoy" ? 1 : 2)
      const r = rank(a.estado) - rank(b.estado)
      if (r !== 0) return r
      return b.total - a.total
    })
}

/** Lista del día: vence hoy o vencidos (y cualquier saldo sin fecha = cobrar). */
export async function getListaCobrarHoy(empresaId: number): Promise<PrestamoItem[]> {
  const all = await getListaPrestamos(empresaId)
  return all.filter((p) => p.cobrarHoy)
}

export async function getResumenPrestamos(empresaId: number): Promise<ResumenPrestamos> {
  const lista = await getListaPrestamos(empresaId)
  const hoy = lista.filter((p) => p.cobrarHoy)
  const vencidos = lista.filter((p) => p.estado === "Vencido")
  const cobradoHoy = lista.reduce((s, p) => s + p.cobradoHoy, 0)

  return {
    total: lista.reduce((s, p) => s + p.total, 0),
    cantidadDeudores: lista.length,
    cobrarHoy: hoy.reduce((s, p) => s + p.total, 0),
    cobrarHoyCount: hoy.length,
    cobradoHoy,
    vencidos: vencidos.reduce((s, p) => s + p.total, 0),
    vencidosCount: vencidos.length,
  }
}

export async function getDetallePrestamo(
  empresaId: number,
  clienteId: number,
): Promise<PrestamoItem | null> {
  const c = await prisma.cliente.findFirst({
    where: { id: clienteId, empresaId, activo: true, deletedAt: null },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      saldoCuentaCorriente: true,
      observaciones: true,
      fechaAlta: true,
    },
  })
  if (!c) return null
  return mapClienteToItem(c)
}

export async function listarClientesParaPrestamo(empresaId: number) {
  const clientes = await loadClientes(empresaId)
  return clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    saldo: Math.max(0, Number(c.saldoCuentaCorriente ?? 0)),
  }))
}

export async function crearPrestamo(
  empresaId: number,
  data: {
    cliente?: string
    clienteId?: number
    capital: number
    interesPct?: number
    fechaVencimiento?: string
    observaciones?: string
    telefono?: string
  },
) {
  const capital = Math.round(Number(data.capital))
  if (!Number.isFinite(capital) || capital <= 0) {
    throw new Error("CAPITAL_INVALIDO")
  }
  const interesPct = data.interesPct != null ? Number(data.interesPct) : 30
  const metaNueva = buildMetaOnCreate({
    capital,
    interesPct,
    fechaVencimiento: data.fechaVencimiento,
  })
  const total = metaNueva.totalOriginal

  let existing =
    data.clienteId != null
      ? await prisma.cliente.findFirst({
          where: { id: data.clienteId, empresaId, activo: true, deletedAt: null },
        })
      : null

  if (!existing && data.cliente?.trim()) {
    existing = await prisma.cliente.findFirst({
      where: {
        empresaId,
        activo: true,
        deletedAt: null,
        nombre: { equals: data.cliente.trim(), mode: "insensitive" },
      },
    })
  }

  if (existing) {
    const saldoActual = Math.max(0, Number(existing.saldoCuentaCorriente ?? 0))
    const { meta: prevMeta, notas } = extractMetaBlock(existing.observaciones)
    const base = prevMeta ?? inferMetaFromLegacy({
      saldo: saldoActual,
      observaciones: existing.observaciones,
      fechaAlta: existing.fechaAlta,
    })

    // Nuevo préstamo al mismo deudor: suma capital/interés y actualiza vencimiento al más lejano
    const merged: PrestamoMeta = {
      v: 1,
      capital: base.capital + metaNueva.capital,
      interesPct: metaNueva.interesPct,
      interes: base.interes + metaNueva.interes,
      totalOriginal: (base.totalOriginal || saldoActual) + total,
      fechaVencimiento:
        metaNueva.fechaVencimiento > (base.fechaVencimiento || "")
          ? metaNueva.fechaVencimiento
          : base.fechaVencimiento || metaNueva.fechaVencimiento,
      cobros: base.cobros ?? [],
    }
    const notaLibre = [notas, data.observaciones].filter(Boolean).join(" · ")
    const nuevoSaldo = saldoActual + total

    const cliente = await prisma.cliente.update({
      where: { id: existing.id },
      data: {
        saldoCuentaCorriente: nuevoSaldo,
        telefono: data.telefono?.trim() || existing.telefono,
        observaciones: serializeObservaciones(merged, notaLibre || null),
      },
    })

    return {
      id: cliente.id,
      cliente: cliente.nombre,
      capital: metaNueva.capital,
      interes: metaNueva.interes,
      total: nuevoSaldo,
      montoCuota: nuevoSaldo,
      reutilizado: true,
    }
  }

  const nombre = data.cliente?.trim()
  if (!nombre) throw new Error("CLIENTE_REQUERIDO")

  const notaSeed =
    data.observaciones?.trim() ||
    `Capital $${capital.toLocaleString("es-AR")} + Interés $${metaNueva.interes.toLocaleString("es-AR")} (${interesPct}%)`

  const cliente = await prisma.cliente.create({
    data: {
      empresaId,
      nombre,
      telefono: data.telefono?.trim() || null,
      saldoCuentaCorriente: total,
      observaciones: serializeObservaciones(metaNueva, notaSeed),
      condicionIva: "Consumidor Final",
      tipoPersona: "persona_fisica",
      fiadoHabilitado: true,
    },
  })

  return {
    id: cliente.id,
    cliente: cliente.nombre,
    capital: metaNueva.capital,
    interes: metaNueva.interes,
    total,
    montoCuota: total,
    reutilizado: false,
  }
}

export async function registrarCobroPrestamo(
  empresaId: number,
  data: {
    clienteId: number
    monto: number
    medio?: MedioCobro
    nota?: string
  },
) {
  const monto = Math.round(Number(data.monto))
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error("MONTO_INVALIDO")
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: data.clienteId, empresaId, deletedAt: null },
  })
  if (!cliente) throw new Error("Cliente no encontrado")

  const saldoActual = Math.max(0, Number(cliente.saldoCuentaCorriente ?? 0))
  if (saldoActual <= 0) {
    throw new Error("SIN_SALDO")
  }

  const montoAplicado = Math.min(monto, saldoActual)
  const nuevoSaldo = Math.max(0, saldoActual - montoAplicado)

  const { meta: prev, notas } = extractMetaBlock(cliente.observaciones)
  const meta =
    prev ??
    inferMetaFromLegacy({
      saldo: saldoActual,
      observaciones: cliente.observaciones,
      fechaAlta: cliente.fechaAlta,
    })

  const cobro: CobroPrestamo = {
    at: new Date().toISOString(),
    monto: montoAplicado,
    saldoDespues: nuevoSaldo,
    medio: data.medio ?? "efectivo",
    nota: data.nota?.trim() || undefined,
  }

  const nextMeta: PrestamoMeta = {
    ...meta,
    cobros: [...(meta.cobros ?? []), cobro],
  }

  const actualizado = await prisma.cliente.update({
    where: { id: cliente.id },
    data: {
      saldoCuentaCorriente: nuevoSaldo,
      observaciones: serializeObservaciones(nextMeta, notas || null),
    },
  })

  return {
    id: actualizado.id,
    cliente: actualizado.nombre,
    telefono: actualizado.telefono,
    saldoPrevio: saldoActual,
    montoCobrado: montoAplicado,
    nuevoSaldo,
    medio: cobro.medio,
    cobros: nextMeta.cobros,
    fechaVencimiento: nextMeta.fechaVencimiento,
  }
}
