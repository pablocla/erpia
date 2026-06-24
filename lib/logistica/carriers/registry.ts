import { andreaniCarrier } from "./andreani"
import { correoArgentinoCarrier } from "./correo-argentino"
import { ocaCarrier } from "./oca"
import type { CarrierAdapter, CarrierId } from "./types"

const CARRIERS: CarrierAdapter[] = [
  andreaniCarrier,
  ocaCarrier,
  correoArgentinoCarrier,
]

const MAP = new Map(CARRIERS.map((c) => [c.id, c]))

export function getCarrier(id: string): CarrierAdapter | undefined {
  return MAP.get(id as CarrierId)
}

export function listCarriers(): CarrierAdapter[] {
  return CARRIERS
}

export const CARRIER_IDS: CarrierId[] = ["andreani", "oca", "correo_argentino"]