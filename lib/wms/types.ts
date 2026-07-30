/** Tipos y constantes WMS light */

export type TipoZona = "picking" | "bulk" | "staging" | "muelle" | "cuarentena" | "devoluciones" | "otro"
export type TipoUbicacion = "bin" | "pick" | "bulk" | "stage" | "dock" | "quarantine"
export type TipoTareaWms = "putaway" | "pick" | "move" | "count" | "replenish"
export type EstadoTareaWms = "pendiente" | "asignada" | "en_proceso" | "completada" | "cancelada" | "short"
export type TipoMovUbicacion =
  | "putaway"
  | "pick"
  | "move"
  | "ajuste"
  | "recepcion"
  | "packing"
  | "replenish"

export interface StockBinCandidate {
  stockUbicacionId: number
  ubicacionId: number
  codigoUbicacion: string
  ordenPath: number
  productoId: number
  loteId: number | null
  fechaVencimiento: Date | null
  cantidadDisponible: number
}

export interface PickAllocation {
  ubicacionId: number
  codigoUbicacion: string
  loteId: number | null
  cantidad: number
  ordenPath: number
}
