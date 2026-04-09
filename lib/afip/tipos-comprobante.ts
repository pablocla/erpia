/**
 * Tabla oficial de Tipos de Comprobante AFIP — Web Service Facturación Electrónica (WSFE v1).
 * Fuente: FEParamGetTiposCbte / Tabla de referencia AFIP RG 3067 y actualizaciones.
 *
 * tipoCbte: código numérico usado en FECAESolicitar → CbteTipo / FeDetReq → CbteDesde
 * letra:    letra del comprobante (A, B, C, M, E, T, etc.)  — "" si no aplica letra
 * nombre:   descripción oficial
 * emitidoPor: "responsable_inscripto" | "monotributista" | "exportacion" | "todos"
 * activo:   false para tipos obsoletos / discontinuados
 */

export interface TipoComprobanteAfip {
  tipoCbte: number
  letra: string
  nombre: string
  emitidoPor: string
  activo: boolean
}

export const TIPOS_COMPROBANTE_AFIP: TipoComprobanteAfip[] = [
  // ── Facturas ───────────────────────────────────────────────────────────────
  { tipoCbte: 1,   letra: "A", nombre: "Factura A",                                      emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 6,   letra: "B", nombre: "Factura B",                                      emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 11,  letra: "C", nombre: "Factura C",                                      emitidoPor: "monotributista",        activo: true  },
  { tipoCbte: 51,  letra: "M", nombre: "Factura M",                                      emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 19,  letra: "",  nombre: "Factura de Exportación",                          emitidoPor: "exportacion",           activo: true  },

  // ── Notas de Débito ────────────────────────────────────────────────────────
  { tipoCbte: 2,   letra: "A", nombre: "Nota de Débito A",                               emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 7,   letra: "B", nombre: "Nota de Débito B",                               emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 12,  letra: "C", nombre: "Nota de Débito C",                               emitidoPor: "monotributista",        activo: true  },
  { tipoCbte: 52,  letra: "M", nombre: "Nota de Débito M",                               emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 20,  letra: "",  nombre: "Nota de Débito por Operaciones con el Exterior",  emitidoPor: "exportacion",           activo: true  },

  // ── Notas de Crédito ───────────────────────────────────────────────────────
  { tipoCbte: 3,   letra: "A", nombre: "Nota de Crédito A",                              emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 8,   letra: "B", nombre: "Nota de Crédito B",                              emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 13,  letra: "C", nombre: "Nota de Crédito C",                              emitidoPor: "monotributista",        activo: true  },
  { tipoCbte: 53,  letra: "M", nombre: "Nota de Crédito M",                              emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 21,  letra: "",  nombre: "Nota de Crédito por Operaciones con el Exterior", emitidoPor: "exportacion",           activo: true  },

  // ── Recibos ────────────────────────────────────────────────────────────────
  { tipoCbte: 4,   letra: "A", nombre: "Recibo A",                                       emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 9,   letra: "B", nombre: "Recibo B",                                       emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 15,  letra: "C", nombre: "Recibo C",                                       emitidoPor: "monotributista",        activo: true  },
  { tipoCbte: 54,  letra: "M", nombre: "Recibo M",                                       emitidoPor: "responsable_inscripto", activo: true  },

  // ── Tiques ─────────────────────────────────────────────────────────────────
  { tipoCbte: 81,  letra: "",  nombre: "Tique",                                           emitidoPor: "todos",                 activo: true  },
  { tipoCbte: 82,  letra: "B", nombre: "Tique Factura B",                                emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 83,  letra: "",  nombre: "Tique",                                           emitidoPor: "todos",                 activo: false },
  { tipoCbte: 111, letra: "C", nombre: "Tique Factura C",                                emitidoPor: "monotributista",        activo: true  },
  { tipoCbte: 185, letra: "A", nombre: "Tique Factura A",                                emitidoPor: "responsable_inscripto", activo: true  },
  { tipoCbte: 186, letra: "M", nombre: "Tique Factura M",                                emitidoPor: "responsable_inscripto", activo: true  },

  // ── Otros comprobantes ─────────────────────────────────────────────────────
  { tipoCbte: 40,  letra: "",  nombre: "Otros Comprobantes A — Documentos que Identifican Conceptos",       emitidoPor: "todos", activo: true },
  { tipoCbte: 41,  letra: "",  nombre: "Liquidación de Servicios Públicos — Clase A",   emitidoPor: "todos", activo: true },
  { tipoCbte: 48,  letra: "",  nombre: "Nota de Débito sin Documento Respaldatorio",     emitidoPor: "todos", activo: true },
  { tipoCbte: 49,  letra: "",  nombre: "Comprobante de Compra de Bienes Usados",         emitidoPor: "todos", activo: true },
  { tipoCbte: 60,  letra: "",  nombre: "Cuenta de Venta y Líquido Producto A",           emitidoPor: "responsable_inscripto", activo: true },
  { tipoCbte: 61,  letra: "",  nombre: "Cuenta de Venta y Líquido Producto B",           emitidoPor: "responsable_inscripto", activo: true },

  // ── Facturas de Crédito Electrónica MiPyMEs (FCE) ────────────────────────
  { tipoCbte: 201, letra: "A", nombre: "Factura de Crédito Electrónica MiPyMEs A",       emitidoPor: "responsable_inscripto", activo: true },
  { tipoCbte: 202, letra: "A", nombre: "Nota de Débito Electrónica MiPyMEs A",           emitidoPor: "responsable_inscripto", activo: true },
  { tipoCbte: 203, letra: "A", nombre: "Nota de Crédito Electrónica MiPyMEs A",          emitidoPor: "responsable_inscripto", activo: true },
  { tipoCbte: 206, letra: "B", nombre: "Factura de Crédito Electrónica MiPyMEs B",       emitidoPor: "responsable_inscripto", activo: true },
  { tipoCbte: 207, letra: "B", nombre: "Nota de Débito Electrónica MiPyMEs B",           emitidoPor: "responsable_inscripto", activo: true },
  { tipoCbte: 208, letra: "B", nombre: "Nota de Crédito Electrónica MiPyMEs B",          emitidoPor: "responsable_inscripto", activo: true },
  { tipoCbte: 211, letra: "C", nombre: "Factura de Crédito Electrónica MiPyMEs C",       emitidoPor: "monotributista",        activo: true },
  { tipoCbte: 212, letra: "C", nombre: "Nota de Débito Electrónica MiPyMEs C",           emitidoPor: "monotributista",        activo: true },
  { tipoCbte: 213, letra: "C", nombre: "Nota de Crédito Electrónica MiPyMEs C",          emitidoPor: "monotributista",        activo: true },

  // ── Remito ─────────────────────────────────────────────────────────────────
  { tipoCbte: 91,  letra: "R", nombre: "Remito R",                                       emitidoPor: "todos", activo: true },
]

/** Códigos AFIP de Alícuotas IVA (Tabla de Alícuotas - WS WSFE) */
export const ALICUOTAS_IVA_AFIP = [
  { codigoAfip: "3", descripcion: "0%",    porcentaje: 0    },
  { codigoAfip: "4", descripcion: "10.5%", porcentaje: 10.5 },
  { codigoAfip: "5", descripcion: "21%",   porcentaje: 21   },
  { codigoAfip: "6", descripcion: "27%",   porcentaje: 27   },
  { codigoAfip: "8", descripcion: "5%",    porcentaje: 5    },
  { codigoAfip: "9", descripcion: "2.5%",  porcentaje: 2.5  },
] as const

/** Códigos de Tributos adicionales en WSFE (array Tributos de FECAEDetRequest) */
export const CODIGOS_TRIBUTOS_AFIP = [
  { id: "1",  descripcion: "Impuestos nacionales"    },
  { id: "2",  descripcion: "Impuestos provinciales"  },
  { id: "3",  descripcion: "Impuestos municipales"   },
  { id: "4",  descripcion: "Impuestos internos"      },
  { id: "99", descripcion: "Otro"                    },
] as const

/** Códigos SICORE para retenciones de IVA y Ganancias */
export const CODIGOS_SICORE = [
  { codigo: "217", descripcion: "Retención IVA — Régimen General",          impuesto: "IVA"       },
  { codigo: "219", descripcion: "Retención IVA — Régimen Simplificado",     impuesto: "IVA"       },
  { codigo: "305", descripcion: "Retención Ganancias — Locaciones de obra", impuesto: "Ganancias" },
  { codigo: "767", descripcion: "Retención Ganancias — Compra bienes",      impuesto: "Ganancias" },
  { codigo: "779", descripcion: "Retención Ganancias — Servicios",          impuesto: "Ganancias" },
] as const

/** Obtiene el tipo de comprobante activo por código */
export function getTipoComprobante(tipoCbte: number): TipoComprobanteAfip | undefined {
  return TIPOS_COMPROBANTE_AFIP.find((t) => t.tipoCbte === tipoCbte)
}

/** Retorna sólo los tipos activos, opcionalmente filtrados por tipo de emisor */
export function getTiposComprobanteActivos(emitidoPor?: string): TipoComprobanteAfip[] {
  return TIPOS_COMPROBANTE_AFIP.filter(
    (t) => t.activo && (!emitidoPor || t.emitidoPor === emitidoPor || t.emitidoPor === "todos"),
  )
}
