export type EstacionComanda = "cocina" | "barra" | "postres" | "parrilla"

export interface ItemComanda {
  id?: string | number
  nombre: string
  cantidad: number
  categoria?: string
  notas?: string
  estacionSugerida?: EstacionComanda
}

export interface TicketEstacion {
  estacion: EstacionComanda
  nombreEstacion: string
  mesaNumero?: string | number
  mozoNombre?: string
  fechaHora: string
  items: ItemComanda[]
  totalItems: number
}

const CATEGORIA_ESTACION_MAP: Record<string, EstacionComanda> = {
  bebida: "barra",
  bebidas: "barra",
  tragos: "barra",
  cerveza: "barra",
  vino: "barra",
  cafeteria: "barra",
  cafe: "barra",
  postre: "postres",
  postres: "postres",
  helado: "postres",
  parrilla: "parrilla",
  carnes: "parrilla",
  achuras: "parrilla",
}

export function clasificarEstacionItem(item: ItemComanda): EstacionComanda {
  if (item.estacionSugerida) return item.estacionSugerida
  if (!item.categoria) return "cocina"

  const catLower = item.categoria.toLowerCase().trim()
  return CATEGORIA_ESTACION_MAP[catLower] || "cocina"
}

/**
 * Recibe un pedido completo de mesa y rutea los ítems por estación de trabajo.
 */
export function rutearComandaPorEstaciones(
  items: ItemComanda[],
  meta: { mesaNumero?: string | number; mozoNombre?: string },
): TicketEstacion[] {
  const agrupado: Record<EstacionComanda, ItemComanda[]> = {
    cocina: [],
    barra: [],
    postres: [],
    parrilla: [],
  }

  for (const item of items) {
    const estacion = clasificarEstacionItem(item)
    agrupado[estacion].push(item)
  }

  const nombresEstacion: Record<EstacionComanda, string> = {
    cocina: "Cocina Principal",
    barra: "Barra & Bebidas",
    postres: "Pastelería & Helados",
    parrilla: "Parrilla",
  }

  const resultado: TicketEstacion[] = []
  const fechaHora = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })

  for (const [estacionKey, list] of Object.entries(agrupado)) {
    if (list.length === 0) continue
    const key = estacionKey as EstacionComanda
    resultado.push({
      estacion: key,
      nombreEstacion: nombresEstacion[key],
      mesaNumero: meta.mesaNumero,
      mozoNombre: meta.mozoNombre,
      fechaHora,
      items: list,
      totalItems: list.reduce((acc, i) => acc + i.cantidad, 0),
    })
  }

  return resultado
}
