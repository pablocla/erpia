import type { ClaverAppBridgeContract } from "./types"

/**
 * Contratos que entregamos al equipo Protheus/SAP del cliente.
 * Ellos implementan el ADVPL/TLPP; nosotros consumimos vía Legacy Bridge.
 */
export const CLAVER_APP_BRIDGE_CONTRACTS: ClaverAppBridgeContract[] = [
  {
    sku: "edge.approvals",
    nombre: "Claver Approvals",
    tagline: "Aprobaciones móviles de compras, pagos y presupuestos",
    requiredEndpoints: [
      {
        path: "/api/claver/v1/approvals/pending",
        method: "GET",
        description: "Lista de documentos pendientes de aprobación del usuario autenticado",
        responseShape: {
          items: "Array<{ id, tipo, monto, moneda, solicitante, fecha, estado }>",
          total: "number",
        },
        protheusHint: "SC1/SC7 + workflow MATA020",
      },
      {
        path: "/api/claver/v1/approvals/{id}/approve",
        method: "POST",
        description: "Aprueba un documento y dispara el workflow nativo",
        requestBody: { comentario: "string (opcional)" },
        responseShape: { ok: "boolean", nuevoEstado: "string" },
      },
      {
        path: "/api/claver/v1/approvals/{id}/reject",
        method: "POST",
        description: "Rechaza un documento",
        requestBody: { motivo: "string" },
        responseShape: { ok: "boolean", nuevoEstado: "string" },
      },
    ],
  },
  {
    sku: "edge.expenses",
    nombre: "Claver Expenses",
    tagline: "Rendición de gastos y viáticos para fuerza de venta",
    requiredEndpoints: [
      {
        path: "/api/claver/v1/expenses",
        method: "POST",
        description: "Crea rendición de gastos con adjuntos OCR",
        requestBody: {
          empleadoId: "string",
          items: "Array<{ fecha, concepto, monto, categoria, adjuntoUrl? }>",
        },
        responseShape: { id: "string", estado: "string", numeroLegacy: "string" },
        protheusHint: "SE1/CT1 + integración Fin 360",
      },
      {
        path: "/api/claver/v1/expenses/{id}",
        method: "GET",
        description: "Detalle de rendición y estado de aprobación",
        responseShape: {
          id: "string",
          estado: "string",
          items: "Array",
          total: "number",
        },
      },
      {
        path: "/api/fin/v1/customers",
        method: "GET",
        description: "Clientes para asignar gasto a cuenta (lectura OPO Customer)",
        responseShape: { items: "Array<{ id, legalName, partyId }>" },
        protheusHint: "SA1 — ya suele existir en REST Fin",
      },
    ],
  },
  {
    sku: "edge.b2b",
    nombre: "Claver B2B Portal",
    tagline: "Portal de clientes y proveedores",
    requiredEndpoints: [
      {
        path: "/api/claver/v1/b2b/orders",
        method: "GET",
        description: "Pedidos del cliente autenticado (portal)",
        responseShape: { items: "Array<{ id, numero, estado, total, fecha }>" },
        protheusHint: "SC5/SC6",
      },
      {
        path: "/api/claver/v1/b2b/invoices",
        method: "GET",
        description: "Facturas y estado de cuenta",
        responseShape: { items: "Array<{ id, numero, total, saldo, vencimiento }>" },
        protheusHint: "SF2/SE1",
      },
      {
        path: "/api/acproduct/v1/products",
        method: "GET",
        description: "Catálogo de productos con precio y stock",
        responseShape: { items: "Array<{ sku, name, unitPrice, stock }>" },
        protheusHint: "SB1/SB2",
      },
    ],
    optionalEndpoints: [
      {
        path: "/api/claver/v1/b2b/orders",
        method: "POST",
        description: "Alta de pedido desde portal (escritura)",
        requestBody: { clienteId: "string", lineas: "Array<{ sku, qty }>" },
        responseShape: { id: "string", numero: "string" },
      },
    ],
  },
  {
    sku: "edge.pos",
    nombre: "Claver POS / Kiosk",
    tagline: "Punto de venta ágil que sincroniza al backoffice",
    requiredEndpoints: [
      {
        path: "/api/claver/v1/pos/tickets",
        method: "POST",
        description: "Inyecta ticket de venta al módulo fiscal legacy",
        requestBody: {
          caja: "string",
          lineas: "Array<{ sku, qty, precio }>",
          pagos: "Array<{ medio, monto }>",
        },
        responseShape: { ticketId: "string", numeroFiscal: "string" },
        protheusHint: "MATA410 + SF2",
      },
      {
        path: "/api/acproduct/v1/products",
        method: "GET",
        description: "Catálogo POS con precio y stock en tiempo real",
        responseShape: { items: "Array<{ sku, name, unitPrice, stock }>" },
      },
    ],
  },
  {
    sku: "edge.warehouse",
    nombre: "Claver Warehouse (WMS móvil)",
    tagline: "Picking y recepción con escáner",
    requiredEndpoints: [
      {
        path: "/api/claver/v1/wms/picking-tasks",
        method: "GET",
        description: "Tareas de picking asignadas al operador",
        responseShape: { items: "Array<{ id, pedido, ubicacion, sku, qty }>" },
        protheusHint: "MATA650 / módulo WMS",
      },
      {
        path: "/api/claver/v1/wms/picking-tasks/{id}/confirm",
        method: "POST",
        description: "Confirma picking y descuenta stock",
        requestBody: { qty: "number", lote: "string?" },
        responseShape: { ok: "boolean" },
      },
    ],
  },
]

export function getBridgeContractBySku(sku: string): ClaverAppBridgeContract | undefined {
  return CLAVER_APP_BRIDGE_CONTRACTS.find((c) => c.sku === sku)
}

export function formatContractForClient(contract: ClaverAppBridgeContract): string {
  const lines = [
    `# Contrato Legacy Bridge — ${contract.nombre}`,
    "",
    `SKU: ${contract.sku}`,
    contract.tagline,
    "",
    "## Endpoints requeridos",
    "",
  ]

  for (const ep of contract.requiredEndpoints) {
    lines.push(`### ${ep.method} ${ep.path}`)
    lines.push(ep.description)
    if (ep.protheusHint) lines.push(`_Hint Protheus: ${ep.protheusHint}_`)
    if (ep.requestBody) {
      lines.push("**Request:**")
      for (const [k, v] of Object.entries(ep.requestBody)) {
        lines.push(`- \`${k}\`: ${v}`)
      }
    }
    lines.push("**Response:**")
    for (const [k, v] of Object.entries(ep.responseShape)) {
      lines.push(`- \`${k}\`: ${v}`)
    }
    lines.push("")
  }

  if (contract.optionalEndpoints?.length) {
    lines.push("## Endpoints opcionales (escritura)")
    lines.push("")
    for (const ep of contract.optionalEndpoints) {
      lines.push(`- ${ep.method} ${ep.path} — ${ep.description}`)
    }
  }

  return lines.join("\n")
}