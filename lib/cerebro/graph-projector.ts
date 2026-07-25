/**
 * Motor Proyector de Grafo de Conocimiento (Graphify / Cerebro Visual)
 * Proyecta TODAS las aplicaciones, sub-SaaS y entidades verticales de Grupo Claver.
 */

import { prisma } from "@/lib/prisma"
import { SUB_SAAS_APPS } from "@/lib/comercial/sub-saas-catalog"

export type NodeCategory =
  | "app"
  | "cliente"
  | "venta"
  | "factura"
  | "producto"
  | "proveedor"
  | "caja"
  | "paciente"
  | "vehiculo"
  | "alerta"

export interface GraphNode {
  id: string
  rawId: number | string
  label: string
  subtext?: string
  category: NodeCategory
  status?: "normal" | "warning" | "danger" | "success"
  metrics?: {
    monto?: number
    cantidad?: number
    deuda?: number
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  relation: "COMPRO" | "FACTURO" | "CONTIENE" | "SUMINISTRA" | "REGISTRO" | "ASOCIADO" | "HABILITA"
  weight?: number
}

export interface KnowledgeGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  summary: {
    totalNodes: number
    totalEdges: number
    riesgoCount: number
    categorias: Record<NodeCategory, number>
    montoTotalVentas: number
    montoTotalFacturado: number
    appsActivasCount: number
  }
}

/**
 * Construye la topología del Grafo de Conocimiento 360° para un tenant dado.
 */
export async function getCompanyKnowledgeGraph(empresaId: number): Promise<KnowledgeGraphData> {
  const [clientes, facturas, productos, proveedores, cajas, movimientosCaja, pacientes, vehiculos] =
    await Promise.all([
      prisma.cliente.findMany({
        where: { empresaId },
        take: 10,
        select: { id: true, nombre: true, email: true, saldoCuentaCorriente: true },
        orderBy: { id: "desc" },
      }),
      prisma.factura.findMany({
        where: { empresaId },
        take: 12,
        select: { id: true, clienteId: true, total: true, estado: true, cae: true, numero: true },
        orderBy: { id: "desc" },
      }),
      prisma.producto.findMany({
        where: { empresaId },
        take: 10,
        select: { id: true, nombre: true, precioVenta: true, stock: true, stockMinimo: true },
        orderBy: { stock: "asc" },
      }),
      prisma.proveedor.findMany({
        where: { empresaId },
        take: 8,
        select: { id: true, nombre: true, cuit: true },
      }),
      prisma.caja.findMany({
        where: { empresaId },
        take: 4,
        select: { id: true, estado: true, observaciones: true },
      }),
      prisma.movimientoCaja.findMany({
        where: { caja: { empresaId } },
        take: 8,
        select: { id: true, monto: true, tipo: true, concepto: true },
        orderBy: { id: "desc" },
      }),
      prisma.paciente.findMany({
        where: { cliente: { empresaId } },
        take: 6,
        select: { id: true, nombre: true, especie: true, raza: true, clienteId: true },
      }).catch(() => []),
      prisma.vehiculo.findMany({
        where: { empresaId },
        take: 6,
        select: { id: true, patente: true, modelo: true, capacidadKg: true },
      }).catch(() => []),
    ])

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const categoriasCount: Record<NodeCategory, number> = {
    app: 0,
    cliente: 0,
    venta: 0,
    factura: 0,
    producto: 0,
    proveedor: 0,
    caja: 0,
    paciente: 0,
    vehiculo: 0,
    alerta: 0,
  }

  let riesgoCount = 0
  let montoTotalVentas = 0
  let montoTotalFacturado = 0

  // 1. Proyectar Apps & Sub-SaaS de Grupo Claver
  for (const app of SUB_SAAS_APPS) {
    categoriasCount.app++
    const appNodeId = `app-${app.slug}`
    nodes.push({
      id: appNodeId,
      rawId: app.slug,
      label: app.marca,
      subtext: app.lema,
      category: "app",
      status: app.estado === "disponible" ? "success" : "normal",
    })
  }

  // 2. Proyectar Nodos de Clientes
  for (const c of clientes) {
    const deuda = Number(c.saldoCuentaCorriente ?? 0)
    const isRiesgo = deuda > 50000
    if (isRiesgo) riesgoCount++
    categoriasCount.cliente++

    nodes.push({
      id: `cli-${c.id}`,
      rawId: c.id,
      label: c.nombre,
      subtext: c.email || (deuda > 0 ? `Deuda: $${deuda.toLocaleString("es-AR")}` : "Cliente activo"),
      category: "cliente",
      status: isRiesgo ? "warning" : "normal",
      metrics: { deuda },
    })

    // Conectar Cliente ➔ App Fiado
    if (deuda > 0) {
      edges.push({
        id: `edge-cli-${c.id}-app-fiado`,
        source: `cli-${c.id}`,
        target: "app-fiado",
        label: "HABILITA",
        relation: "HABILITA",
      })
    }
  }

  // 3. Proyectar Nodos de Proveedores
  for (const p of proveedores) {
    categoriasCount.proveedor++
    nodes.push({
      id: `prov-${p.id}`,
      rawId: p.id,
      label: p.nombre,
      subtext: p.cuit ? `CUIT: ${p.cuit}` : "Proveedor clave",
      category: "proveedor",
      status: "normal",
    })
  }

  // 4. Proyectar Nodos de Productos / Stock
  for (const prod of productos) {
    categoriasCount.producto++
    const stock = Number(prod.stock ?? 0)
    const stockMin = Number(prod.stockMinimo ?? 5)
    const isBajoStock = stock <= stockMin
    if (isBajoStock) riesgoCount++

    const prodNodeId = `prod-${prod.id}`
    nodes.push({
      id: prodNodeId,
      rawId: prod.id,
      label: prod.nombre,
      subtext: `Stock: ${stock} u | $${Number(prod.precioVenta ?? 0).toLocaleString("es-AR")}`,
      category: "producto",
      status: isBajoStock ? "danger" : "success",
      metrics: { cantidad: stock, monto: Number(prod.precioVenta ?? 0) },
    })

    // Conectar Producto ➔ POS App
    edges.push({
      id: `edge-prod-${prod.id}-app-pos`,
      source: prodNodeId,
      target: "app-pos",
      label: "CONTIENE",
      relation: "CONTIENE",
    })
  }

  // 5. Proyectar Nodos de Facturas AFIP & Ventas
  for (const f of facturas) {
    categoriasCount.factura++
    const total = Number(f.total ?? 0)
    montoTotalVentas += total
    if (f.cae) montoTotalFacturado += total

    const facNodeId = `fac-${f.id}`
    nodes.push({
      id: facNodeId,
      rawId: f.id,
      label: `Factura ${f.numero ?? `#${f.id}`}`,
      subtext: f.cae ? `CAE: ${f.cae.slice(0, 8)}...` : `$${total.toLocaleString("es-AR")} · ${f.estado}`,
      category: "factura",
      status: f.cae ? "success" : "warning",
      metrics: { monto: total },
    })

    if (f.clienteId) {
      const cliNodeId = `cli-${f.clienteId}`
      if (nodes.some((n) => n.id === cliNodeId)) {
        edges.push({
          id: `edge-${cliNodeId}-${facNodeId}`,
          source: cliNodeId,
          target: facNodeId,
          label: "FACTURO",
          relation: "FACTURO",
          weight: total,
        })
      }
    }
  }

  // 6. Proyectar Nodos de Veterinaria / Historia Clínica (Pacientes)
  for (const pac of pacientes) {
    categoriasCount.paciente++
    const pacNodeId = `pac-${pac.id}`
    nodes.push({
      id: pacNodeId,
      rawId: pac.id,
      label: pac.nombre,
      subtext: `${pac.especie ?? "Mascota"} ${pac.raza ? `(${pac.raza})` : ""}`,
      category: "paciente",
      status: "normal",
    })

    // Conectar Paciente ➔ App Veterinaria
    edges.push({
      id: `edge-pac-${pac.id}-app-veterinaria`,
      source: pacNodeId,
      target: "app-veterinaria",
      label: "ASOCIADO",
      relation: "ASOCIADO",
    })

    // Conectar Paciente ➔ Cliente (Dueño)
    if (pac.clienteId) {
      const cliNodeId = `cli-${pac.clienteId}`
      if (nodes.some((n) => n.id === cliNodeId)) {
        edges.push({
          id: `edge-cli-${pac.clienteId}-pac-${pac.id}`,
          source: cliNodeId,
          target: pacNodeId,
          label: "ASOCIADO",
          relation: "ASOCIADO",
        })
      }
    }
  }

  // 7. Proyectar Nodos de Distribución / Vehículos
  for (const veh of vehiculos) {
    categoriasCount.vehiculo++
    const vehNodeId = `veh-${veh.id}`
    nodes.push({
      id: vehNodeId,
      rawId: veh.id,
      label: `Patente ${veh.patente}`,
      subtext: `${veh.modelo ?? "Unidad"} · Cap: ${veh.capacidadKg ?? 1000} kg`,
      category: "vehiculo",
      status: "normal",
    })
  }

  // 8. Proyectar Cajas y Movimientos
  for (const cj of cajas) {
    categoriasCount.caja++
    nodes.push({
      id: `caja-${cj.id}`,
      rawId: cj.id,
      label: cj.observaciones || `Caja #${cj.id}`,
      subtext: `Estado: ${cj.estado}`,
      category: "caja",
      status: cj.estado === "abierta" ? "success" : "normal",
    })
  }

  for (const mc of movimientosCaja) {
    categoriasCount.caja++
    const monto = Number(mc.monto ?? 0)
    const mcNodeId = `mcaja-${mc.id}`

    nodes.push({
      id: mcNodeId,
      rawId: mc.id,
      label: `Mov: ${mc.tipo.toUpperCase()}`,
      subtext: `${mc.concepto || "Movimiento"} · $${monto.toLocaleString("es-AR")}`,
      category: "caja",
      status: mc.tipo === "egreso" ? "warning" : "success",
      metrics: { monto },
    })
  }

  return {
    nodes,
    edges,
    summary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      riesgoCount,
      categorias: categoriasCount,
      montoTotalVentas,
      montoTotalFacturado,
      appsActivasCount: SUB_SAAS_APPS.length,
    },
  }
}
