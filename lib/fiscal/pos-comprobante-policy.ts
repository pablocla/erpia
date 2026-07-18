/**
 * Política de comprobante en POS:
 * - AFIP (default): factura electrónica A/B/C con CAE
 * - Cajero: elige en cada venta (AFIP o ticket sin CAE)
 * - Ticket solo: operativo sin AFIP
 */

export type ModoComprobantePos = "afip" | "cajero" | "ticket_solo"
export type TipoFacturaPos = "A" | "B" | "C" | "ticket"
export type TipoDefaultAfip = "auto" | "A" | "B" | "C"

export interface PosComprobantePolicyInput {
  modoComprobante: ModoComprobantePos
  tipoDefaultAfip: TipoDefaultAfip
  /** Sugerido por condición IVA del cliente (A/B/C) */
  tipoSugeridoCliente?: TipoFacturaPos | null
  permitirTicketSinAfip: boolean
  /** Sin certificado o AFIP caído */
  afipDisponible: boolean
  offline?: boolean
  /** Elección manual del cajero */
  tipoElegido?: TipoFacturaPos | null
  tipoManual?: boolean
}

export interface PosComprobantePolicyResult {
  tipoEfectivo: TipoFacturaPos
  tiposPermitidos: TipoFacturaPos[]
  selectorBloqueado: boolean
  etiquetaModo: string
  requiereAfip: boolean
  motivo?: string
}

const TIPOS_AFIP: TipoFacturaPos[] = ["A", "B", "C"]

export function tiposPermitidosSegunModo(
  modo: ModoComprobantePos,
  permitirTicketSinAfip: boolean,
  afipDisponible: boolean,
): TipoFacturaPos[] {
  if (modo === "ticket_solo") return ["ticket"]
  if (modo === "afip") {
    if (!afipDisponible && permitirTicketSinAfip) return [...TIPOS_AFIP, "ticket"]
    if (!afipDisponible) return permitirTicketSinAfip ? ["ticket"] : [...TIPOS_AFIP]
    return permitirTicketSinAfip ? [...TIPOS_AFIP, "ticket"] : [...TIPOS_AFIP]
  }
  // cajero: siempre puede elegir; si AFIP no está, ticket es la salida segura
  return afipDisponible ? [...TIPOS_AFIP, "ticket"] : ["ticket", ...TIPOS_AFIP]
}

export function resolverTipoDefault(input: {
  modoComprobante: ModoComprobantePos
  tipoDefaultAfip: TipoDefaultAfip
  tipoSugeridoCliente?: TipoFacturaPos | null
}): TipoFacturaPos {
  if (input.modoComprobante === "ticket_solo") return "ticket"
  if (input.tipoDefaultAfip === "auto") {
    const s = input.tipoSugeridoCliente
    if (s && s !== "ticket") return s
    return "B"
  }
  return input.tipoDefaultAfip
}

/**
 * Resuelve el tipo de comprobante efectivo para la venta.
 */
export function resolvePosComprobante(input: PosComprobantePolicyInput): PosComprobantePolicyResult {
  const tiposPermitidos = tiposPermitidosSegunModo(
    input.modoComprobante,
    input.permitirTicketSinAfip,
    input.afipDisponible,
  )

  if (input.offline) {
    return {
      tipoEfectivo: "ticket",
      tiposPermitidos: ["ticket"],
      selectorBloqueado: true,
      etiquetaModo: "Offline → Ticket sin CAE",
      requiereAfip: false,
      motivo: "Sin conexión: solo ticket operativo",
    }
  }

  if (input.modoComprobante === "ticket_solo") {
    return {
      tipoEfectivo: "ticket",
      tiposPermitidos: ["ticket"],
      selectorBloqueado: true,
      etiquetaModo: "Solo ticket (sin AFIP)",
      requiereAfip: false,
    }
  }

  const defaultTipo = resolverTipoDefault({
    modoComprobante: input.modoComprobante,
    tipoDefaultAfip: input.tipoDefaultAfip,
    tipoSugeridoCliente: input.tipoSugeridoCliente,
  })

  // Modo AFIP: fuerza fiscal salvo ticket explícito permitido
  if (input.modoComprobante === "afip") {
    const elegido =
      input.tipoManual && input.tipoElegido && tiposPermitidos.includes(input.tipoElegido)
        ? input.tipoElegido
        : defaultTipo

    let tipoEfectivo = elegido
    if (tipoEfectivo === "ticket" && !input.permitirTicketSinAfip && input.afipDisponible) {
      tipoEfectivo = defaultTipo === "ticket" ? "B" : defaultTipo
    }
    if (!input.afipDisponible && input.permitirTicketSinAfip) {
      tipoEfectivo = input.tipoManual && input.tipoElegido === "ticket" ? "ticket" : tipoEfectivo
      if (!input.afipDisponible && tipoEfectivo !== "ticket") {
        // Sin cert: no se puede emitir AFIP — cae a ticket si está permitido
        tipoEfectivo = "ticket"
      }
    }

    return {
      tipoEfectivo,
      tiposPermitidos,
      selectorBloqueado: !input.permitirTicketSinAfip && input.afipDisponible,
      etiquetaModo: input.afipDisponible ? "AFIP electrónico" : "AFIP no disponible",
      requiereAfip: tipoEfectivo !== "ticket",
      motivo: !input.afipDisponible
        ? "Sin certificado AFIP — usá ticket o configurá el cert"
        : undefined,
    }
  }

  // Cajero elige
  const elegidoCajero =
    input.tipoElegido && tiposPermitidos.includes(input.tipoElegido)
      ? input.tipoElegido
      : defaultTipo

  return {
    tipoEfectivo: elegidoCajero,
    tiposPermitidos,
    selectorBloqueado: false,
    etiquetaModo: "Cajero elige comprobante",
    requiereAfip: elegidoCajero !== "ticket",
  }
}

export const MODO_COMPROBANTE_LABELS: Record<ModoComprobantePos, string> = {
  afip: "Siempre AFIP (factura electrónica A/B/C)",
  cajero: "El cajero elige (AFIP o ticket sin CAE)",
  ticket_solo: "Solo ticket operativo (sin AFIP)",
}
