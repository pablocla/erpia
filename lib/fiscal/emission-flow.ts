/**
 * Rutas de emisión fiscal AFIP — para diagrama y validación de caminos.
 */

export type EmissionPathId =
  | "nacional_cae"
  | "nacional_caea"
  | "fce_mipyme"
  | "exportacion"
  | "ticket_sin_cae"
  | "pendiente_cae"

export interface EmissionPath {
  id: EmissionPathId
  label: string
  descripcion: string
  requiereCae: boolean
  modalidadAuth: "CAE" | "CAEA" | null
}

export const EMISSION_PATHS: EmissionPath[] = [
  {
    id: "nacional_cae",
    label: "Factura nacional (CAE)",
    descripcion: "WSFE online — A/B/C con CAE y QR tipo E",
    requiereCae: true,
    modalidadAuth: "CAE",
  },
  {
    id: "nacional_caea",
    label: "Contingencia CAEA",
    descripcion: "Sin WSFE — CAEA vigente, QR tipo A, informe posterior",
    requiereCae: true,
    modalidadAuth: "CAEA",
  },
  {
    id: "fce_mipyme",
    label: "FCE MiPyME",
    descripcion: "Gran empresa ≥ umbral — tipos 201/206/211 + CBU",
    requiereCae: true,
    modalidadAuth: "CAE",
  },
  {
    id: "exportacion",
    label: "Exportación",
    descripcion: "Cliente exportación — tipos 19/20/21",
    requiereCae: true,
    modalidadAuth: "CAE",
  },
  {
    id: "ticket_sin_cae",
    label: "Ticket operativo",
    descripcion: "Sin validez fiscal — reimprimir con CAE después",
    requiereCae: false,
    modalidadAuth: null,
  },
  {
    id: "pendiente_cae",
    label: "Pendiente CAE",
    descripcion: "Comprobante guardado — reintento manual o cron",
    requiereCae: true,
    modalidadAuth: null,
  },
]

export interface ResolveEmissionPathInput {
  esTicket?: boolean
  tipoCbte?: number
  modalidadAuth?: string | null
  estado?: string | null
  esFce?: boolean
  esExportacion?: boolean
  pendienteCae?: boolean
}

export function resolveEmissionPath(input: ResolveEmissionPathInput): EmissionPath {
  if (input.esTicket || input.estado === "ticket") {
    return EMISSION_PATHS.find((p) => p.id === "ticket_sin_cae")!
  }
  if (input.pendienteCae || input.estado === "pendiente_cae") {
    return EMISSION_PATHS.find((p) => p.id === "pendiente_cae")!
  }
  if (input.modalidadAuth === "CAEA") {
    return EMISSION_PATHS.find((p) => p.id === "nacional_caea")!
  }
  if (input.esExportacion || [19, 20, 21].includes(input.tipoCbte ?? 0)) {
    return EMISSION_PATHS.find((p) => p.id === "exportacion")!
  }
  if (input.esFce || [201, 206, 211].includes(input.tipoCbte ?? 0)) {
    return EMISSION_PATHS.find((p) => p.id === "fce_mipyme")!
  }
  return EMISSION_PATHS.find((p) => p.id === "nacional_cae")!
}

/** Diagrama Mermaid para documentación / UI */
export const EMISSION_FLOW_MERMAID = `flowchart TD
  start([Emisión comprobante]) --> tipo{¿Tipo POS?}
  tipo -->|Ticket sin CAE| tkt[Ticket operativo]
  tipo -->|A / B / C fiscal| cliente{¿Cliente?}
  cliente -->|Exportación| exp[Factura E — tipo 19]
  cliente -->|Gran Empresa ≥ umbral| fce[FCE MiPyME — 201/206/211]
  cliente -->|Nacional| afip{¿AFIP online?}
  afip -->|Sí| cae[CAE WSFE + QR E]
  afip -->|No + CAEA vigente| caea[CAEA + QR A]
  afip -->|No sin CAEA| pend[Pendiente CAE]
  cae --> salida{Salida parametrizada}
  caea --> salida
  exp --> salida
  fce --> salida
  pend --> salida
  tkt --> salida
  salida -->|Impresora| hasar[Hasar / Epson ESC/POS]
  salida -->|PDF| pdf[HTML A4 + QR]
  salida -->|Ambos| hasar
  salida -->|Ambos| pdf
  hasar --> fin([Comprobante entregado])
  pdf --> fin
  cobro[Cobro tarjeta/QR] -.->|Manual o MercadoPago| start
`