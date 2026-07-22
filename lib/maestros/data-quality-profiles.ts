export type PackContext = {
  modoLite: string
  rubro: string
}

export type FieldRequirement = {
  field: string
  label: string
  severity: "required" | "recommended"
  reason: string
}

export function getClienteRequiredFields(ctx: PackContext): FieldRequirement[] {
  const { modoLite, rubro } = ctx
  const reqs: FieldRequirement[] = []

  // Default always required
  reqs.push({ field: "nombre", label: "Nombre o Razón Social", severity: "required", reason: "Identificación básica del cliente" })

  if (modoLite === "fiado" || modoLite === "pos") {
    // Si es kiosco/pos, el teléfono es recomendado. Si es fiado, es requerido.
    if (modoLite === "fiado") {
      reqs.push({ field: "telefono", label: "Teléfono", severity: "required", reason: "Necesario para envíos de recordatorios de deuda" })
      reqs.push({ field: "fiadoHabilitado", label: "Fiado Habilitado", severity: "required", reason: "Permite usar la funcionalidad de cuenta corriente" })
      reqs.push({ field: "limiteCredito", label: "Límite de Crédito", severity: "required", reason: "Controla el tope de deuda permitida" })
      reqs.push({ field: "emailNotificacionFiado", label: "Email notificaciones", severity: "recommended", reason: "Vía alternativa para enviar el resumen de cuenta" })
    } else {
      reqs.push({ field: "telefono", label: "Teléfono", severity: "recommended", reason: "Útil para fidelización y ticket digital" })
      reqs.push({ field: "condicionIva", label: "Condición frente al IVA", severity: "recommended", reason: "Requerido si se hacen facturas A" })
      reqs.push({ field: "cuit", label: "CUIT", severity: "recommended", reason: "Requerido si no es consumidor final" })
    }
  } else if (modoLite === "completo" || rubro?.includes("facturacion")) {
    reqs.push({ field: "cuit", label: "CUIT", severity: "required", reason: "Requerido por AFIP para comprobantes" })
    reqs.push({ field: "condicionIva", label: "Condición frente al IVA", severity: "required", reason: "Requerido por AFIP para determinar tipo de comprobante" })
    reqs.push({ field: "direccion", label: "Dirección", severity: "recommended", reason: "Útil para facturas y envíos" })
    reqs.push({ field: "emailFacturacion", label: "Email de Facturación", severity: "recommended", reason: "Envío automático de comprobantes" })
  } else {
    reqs.push({ field: "telefono", label: "Teléfono", severity: "recommended", reason: "Contacto principal" })
  }

  return reqs
}

export function getProveedorRequiredFields(ctx: PackContext): FieldRequirement[] {
  const { modoLite } = ctx
  const reqs: FieldRequirement[] = []

  reqs.push({ field: "nombre", label: "Razón Social", severity: "required", reason: "Identificación del proveedor" })
  reqs.push({ field: "cuit", label: "CUIT", severity: "required", reason: "Necesario para registrar facturas de compra" })

  if (modoLite === "completo" || modoLite === "pos") {
    reqs.push({ field: "condicionIva", label: "Condición frente al IVA", severity: "required", reason: "Necesario para el cálculo de impuestos" })
    reqs.push({ field: "telefono", label: "Teléfono", severity: "recommended", reason: "Contacto de compras" })
    reqs.push({ field: "condicionPagoId", label: "Condición de Pago", severity: "recommended", reason: "Planificación financiera (días de pago)" })
  } else {
    reqs.push({ field: "condicionIva", label: "Condición frente al IVA", severity: "recommended", reason: "Información fiscal" })
  }

  return reqs
}

export function evaluateCompleteness(entity: Record<string, any>, reqs: FieldRequirement[]): {
  ok: boolean
  missingRequired: FieldRequirement[]
  missingRecommended: FieldRequirement[]
  score: number
} {
  const missingRequired = reqs.filter(r => r.severity === "required" && isMissing(entity[r.field]))
  const missingRecommended = reqs.filter(r => r.severity === "recommended" && isMissing(entity[r.field]))

  const totalScore = reqs.length * 10
  const scoreBase = reqs.length > 0 ? (reqs.length - missingRequired.length - missingRecommended.length) * 10 : 100
  const score = totalScore > 0 ? Math.round((scoreBase / totalScore) * 100) : 100

  return {
    ok: missingRequired.length === 0,
    missingRequired,
    missingRecommended,
    score
  }
}

export function evaluateClienteCompleteness(cliente: Record<string, any>, ctx: PackContext) {
  return evaluateCompleteness(cliente, getClienteRequiredFields(ctx))
}

export function evaluateProveedorCompleteness(proveedor: Record<string, any>, ctx: PackContext) {
  return evaluateCompleteness(proveedor, getProveedorRequiredFields(ctx))
}

function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string" && value.trim() === "") return true
  if (typeof value === "number" && Number.isNaN(value)) return true
  // boolean false y 0 son valores válidos (ej. fiadoHabilitado=false, limiteCredito=0)
  return false
}
