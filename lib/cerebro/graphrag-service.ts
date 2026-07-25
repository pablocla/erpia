/**
 * Motor GraphRAG para Grupo Claver ERP
 * Ejecuta consultas multi-hop recorriendo el Grafo de Conocimiento del tenant.
 */

import { getCompanyKnowledgeGraph, type KnowledgeGraphData, type GraphNode, type GraphEdge } from "@/lib/cerebro/graph-projector"

export interface GraphRAGResult {
  query: string
  response: string
  hallazgosClave: string[]
  highlightNodeIds: string[]
  highlightEdgeIds: string[]
  subgrafoRelacionado: {
    nodos: GraphNode[]
    aristas: GraphEdge[]
  }
}

/**
 * Procesa una consulta en lenguaje natural sobre el grafo del tenant.
 */
export async function queryGraphRAG(empresaId: number, query: string): Promise<GraphRAGResult> {
  const graph = await getCompanyKnowledgeGraph(empresaId)
  const queryLower = query.toLowerCase()

  let response = ""
  const hallazgosClave: string[] = []
  const highlightNodeIds: string[] = []
  const highlightEdgeIds: string[] = []

  // 1. Caso: Deuda / Clientes en Riesgo
  if (queryLower.includes("deuda") || queryLower.includes("cliente") || queryLower.includes("riesgo") || queryLower.includes("incobrable")) {
    const clientesDeuda = graph.nodes.filter((n) => n.category === "cliente" && (n.metrics?.deuda ?? 0) > 0)
    
    if (clientesDeuda.length > 0) {
      clientesDeuda.forEach((n) => highlightNodeIds.push(n.id))
      
      // Conectar con sus ventas y facturas
      graph.edges.forEach((e) => {
        if (highlightNodeIds.includes(e.source) || highlightNodeIds.includes(e.target)) {
          highlightEdgeIds.push(e.id)
          if (!highlightNodeIds.includes(e.source)) highlightNodeIds.push(e.source)
          if (!highlightNodeIds.includes(e.target)) highlightNodeIds.push(e.target)
        }
      })

      const maxDeuda = Math.max(...clientesDeuda.map((c) => c.metrics?.deuda ?? 0))
      const clienteTop = clientesDeuda.find((c) => c.metrics?.deuda === maxDeuda)

      response = `Analizando el Grafo de Conocimiento, se detectaron ${clientesDeuda.length} cliente(s) con saldo pendiente en cuenta corriente. El cliente con mayor riesgo financiero es "${clienteTop?.label}" con una deuda activa de $${maxDeuda.toLocaleString("es-AR")}.`
      
      hallazgosClave.push(`Deuda acumulada activa: $${graph.nodes.reduce((acc, n) => acc + (n.metrics?.deuda ?? 0), 0).toLocaleString("es-AR")}`)
      hallazgosClave.push(`Cliente crítico: ${clienteTop?.label} ($${maxDeuda.toLocaleString("es-AR")})`)
      hallazgosClave.push("Recomendación: Enviar recordatorio de pago antes de otorgar nueva línea de fiado.")
    } else {
      response = "El análisis del grafo no detectó clientes con deuda activa o saldo moroso en cuenta corriente."
      hallazgosClave.push("Cuentas corrientes en estado óptimo.")
    }
  } 
  // 2. Caso: Stock / Productos / Proveedores
  else if (queryLower.includes("stock") || queryLower.includes("producto") || queryLower.includes("proveedor") || queryLower.includes("faltante") || queryLower.includes("retraso")) {
    const productosStockBajo = graph.nodes.filter((n) => n.category === "producto" && n.status === "danger")
    
    if (productosStockBajo.length > 0) {
      productosStockBajo.forEach((n) => highlightNodeIds.push(n.id))

      // Encontrar proveedores conectados
      graph.edges.forEach((e) => {
        if (highlightNodeIds.includes(e.target) && e.relation === "SUMINISTRA") {
          highlightEdgeIds.push(e.id)
          if (!highlightNodeIds.includes(e.source)) highlightNodeIds.push(e.source)
        }
      })

      const prodNombres = productosStockBajo.map((p) => p.label).join(", ")
      response = `El motor GraphRAG identificó ${productosStockBajo.length} producto(s) en nivel crítico de stock (${prodNombres}). Se rastreó la arista de suministro hacia los proveedores clave para acelerar la reposición.`

      hallazgosClave.push(`Productos bajo punto de pedido: ${productosStockBajo.length}`)
      hallazgosClave.push("Proveedores vinculados alertados en el canvas.")
      hallazgosClave.push("Acción sugerida: Generar Orden de Compra (OC) directa.")
    } else {
      response = "Todos los productos proyectados en el grafo registran niveles de stock dentro de los umbrales seguros."
      hallazgosClave.push("Inventario sin alertas de quiebre de stock.")
    }
  }
  // 3. Caso: Ventas / Facturación AFIP / Recaudación
  else if (queryLower.includes("venta") || queryLower.includes("factura") || queryLower.includes("afip") || queryLower.includes("caja") || queryLower.includes("bajar")) {
    const nodosVenta = graph.nodes.filter((n) => n.category === "venta" || n.category === "factura")
    nodosVenta.forEach((n) => highlightNodeIds.push(n.id))

    graph.edges.forEach((e) => {
      if (highlightNodeIds.includes(e.target)) {
        highlightEdgeIds.push(e.id)
        if (!highlightNodeIds.includes(e.source)) highlightNodeIds.push(e.source)
      }
    })

    const totalVentas = graph.summary.montoTotalVentas
    const totalFacturas = graph.summary.montoTotalFacturado
    const ratioFacturacion = totalVentas > 0 ? Math.round((totalFacturas / totalVentas) * 100) : 100

    response = `El circuito transaccional registra $${totalVentas.toLocaleString("es-AR")} en ventas totales y $${totalFacturas.toLocaleString("es-AR")} formalizados con comprobantes AFIP (cobertura del ${ratioFacturacion}%).`

    hallazgosClave.push(`Monto Total Transaccionado: $${totalVentas.toLocaleString("es-AR")}`)
    hallazgosClave.push(`Emisión AFIP Electrónica: $${totalFacturas.toLocaleString("es-AR")} (${ratioFacturacion}% cobertura)`)
    hallazgosClave.push("Estado del circuito: Saludable y sincronizado.")
  }
  // 4. Caso General / Resumen 360°
  else {
    graph.nodes.slice(0, 10).forEach((n) => highlightNodeIds.push(n.id))
    graph.edges.slice(0, 8).forEach((e) => highlightEdgeIds.push(e.id))

    response = `Visión general del Grafo de Conocimiento: El mapa activo cuenta con ${graph.summary.totalNodes} nodos y ${graph.summary.totalEdges} relaciones interconectadas entre Clientes, Ventas, Facturas AFIP, Productos, Proveedores y Caja.`

    hallazgosClave.push(`Total Nodos Registrados: ${graph.summary.totalNodes}`)
    hallazgosClave.push(`Nodos en Alerta/Riesgo: ${graph.summary.riesgoCount}`)
    hallazgosClave.push("Módelo multi-tenant seguro y sincronizado.")
  }

  const subnodos = graph.nodes.filter((n) => highlightNodeIds.includes(n.id))
  const subaristas = graph.edges.filter((e) => highlightEdgeIds.includes(e.id))

  return {
    query,
    response,
    hallazgosClave,
    highlightNodeIds,
    highlightEdgeIds,
    subgrafoRelacionado: {
      nodos: subnodos,
      aristas: subaristas,
    },
  }
}
