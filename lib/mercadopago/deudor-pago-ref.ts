/**
 * Parseo de external_reference de pagos de deudores (Fiado / CxC).
 * Distinto de suscripción SaaS: claver-empresa-{id}-sku-...
 */

export type DeudorPagoRef =
  | { kind: "fiado"; facturaId: number; clienteId: number; cuentaCobrarId?: number }
  | { kind: "cxc"; cuentaCobrarId: number }
  | { kind: "fac"; facturaId: number }
  | { kind: "unknown"; raw: string }

/** Construye ref estable para preferencias de cobro de fiado/CC. */
export function buildFiadoPagoExternalRef(input: {
  empresaId: number
  clienteId: number
  facturaId?: number
  cuentaCobrarId?: number
}): string {
  const fac = input.facturaId && input.facturaId > 0 ? input.facturaId : 0
  const base = `fiado-${fac}-${input.clienteId}`
  if (input.cuentaCobrarId) return `${base}-cc-${input.cuentaCobrarId}-e${input.empresaId}`
  return `${base}-e${input.empresaId}`
}

export function parseDeudorPagoRef(externalRef: string | null | undefined): DeudorPagoRef {
  const raw = (externalRef ?? "").trim()
  if (!raw) return { kind: "unknown", raw: "" }

  // fiado-{facturaId}-{clienteId}[-cc-{ccId}][-e{empresaId}]
  const fiado = raw.match(/^fiado-(\d+)-(\d+)(?:-cc-(\d+))?(?:-e\d+)?$/)
  if (fiado) {
    return {
      kind: "fiado",
      facturaId: parseInt(fiado[1], 10),
      clienteId: parseInt(fiado[2], 10),
      cuentaCobrarId: fiado[3] ? parseInt(fiado[3], 10) : undefined,
    }
  }

  // cxc-123 | cobro-cc-123
  const cxc = raw.match(/^(?:cxc|cobro-cc)-(\d+)$/)
  if (cxc) {
    return { kind: "cxc", cuentaCobrarId: parseInt(cxc[1], 10) }
  }

  // fac-123
  const fac = raw.match(/^fac-(\d+)$/)
  if (fac) {
    return { kind: "fac", facturaId: parseInt(fac[1], 10) }
  }

  return { kind: "unknown", raw }
}

export function isDeudorPagoRef(externalRef: string | null | undefined): boolean {
  const p = parseDeudorPagoRef(externalRef)
  return p.kind !== "unknown"
}
