import { rutearComandaPorEstaciones, type ItemComanda, type TicketEstacion } from "./ruteo-comandas-service"

export interface SelfOrderGuestPayload {
  empresaId: number
  mesaNumero: string | number
  comensalNombre?: string
  items: {
    nombre: string
    cantidad: number
    precioUnitario: number
    categoria?: string
    notas?: string
  }[]
}

export interface SelfOrderProcessResult {
  ok: boolean
  mesaNumero: string | number
  totalItems: number
  totalEstimado: number
  ticketsEstacion: TicketEstacion[]
  mensaje: string
}

/**
 * Procesa la comanda enviada por el comensal desde el QR de la mesa y dispara los tickets a cocina/barra.
 */
export function procesarSelfOrderMesa(payload: SelfOrderGuestPayload): SelfOrderProcessResult {
  const itemsComanda: ItemComanda[] = payload.items.map((i) => ({
    nombre: i.nombre,
    cantidad: i.cantidad,
    categoria: i.categoria,
    notas: i.notas,
  }))

  const ticketsEstacion = rutearComandaPorEstaciones(itemsComanda, {
    mesaNumero: payload.mesaNumero,
    mozoNombre: payload.comensalNombre || "Self-Order QR",
  })

  const totalEstimado = payload.items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0)
  const totalItems = payload.items.reduce((acc, i) => acc + i.cantidad, 0)

  return {
    ok: true,
    mesaNumero: payload.mesaNumero,
    totalItems,
    totalEstimado,
    ticketsEstacion,
    mensaje: `Comanda enviada a cocina para Mesa #${payload.mesaNumero} desde el QR del comensal.`,
  }
}
