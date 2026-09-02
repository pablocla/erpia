import { prisma } from "@/lib/prisma"
import type { AgentStatus, DepartmentId, OfficeDeskPresence, OfficeLiveEvent, OfficePresence } from "@/types/agent-city"

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function desk(
  departmentId: DepartmentId,
  busy: boolean,
  waiting: boolean,
  message: string,
  tasksToday: number,
  flag?: string,
): OfficeDeskPresence {
  let status: AgentStatus = "ONLINE"
  if (waiting) status = "WAITING"
  else if (busy) status = "EXECUTING"
  return { departmentId, status, statusMessage: message, tasksToday, flag }
}

export async function buildOfficePresence(): Promise<OfficePresence> {
  const today = startOfToday()

  const [
    facturasHoy,
    facturasPendientes,
    lastFacturas,
    ticketsAbiertos,
    ticketsCriticos,
    lastTickets,
    pedidosAbiertos,
    lastPedidos,
    cxVencidas,
    empresa,
  ] = await Promise.all([
    prisma.factura.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
    prisma.factura.count({ where: { estado: "pendiente", deletedAt: null } }),
    prisma.factura.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { tipo: true, numero: true, puntoVenta: true, estado: true, cae: true, createdAt: true },
    }),
    prisma.ticket.count({ where: { estado: { in: ["abierto", "en_progreso"] } } }),
    prisma.ticket.count({
      where: { estado: { in: ["abierto", "en_progreso"] }, prioridad: { in: ["alta", "critica"] } },
    }),
    prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { numero: true, titulo: true, estado: true, prioridad: true, modulo: true, createdAt: true },
    }),
    prisma.pedidoVenta.count({
      where: { estado: { in: ["pendiente_pago", "confirmado", "en_picking"] } },
    }),
    prisma.pedidoVenta.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { numero: true, estado: true, createdAt: true },
    }),
    prisma.cuentaCobrar.count({ where: { estado: "vencida" } }),
    prisma.empresa.findFirst({ select: { nombre: true } }),
  ])

  const lastFac = lastFacturas[0]
  const lastFacLabel = lastFac
    ? `FV ${lastFac.tipo}-${lastFac.puntoVenta}-${lastFac.numero} · ${lastFac.estado}`
    : "Sin facturas"

  const desks: OfficeDeskPresence[] = [
    desk(
      "BILLING",
      facturasPendientes > 0 || facturasHoy > 0,
      facturasPendientes > 0,
      facturasPendientes > 0
        ? `${facturasPendientes} sin CAE / pendientes`
        : lastFacLabel,
      facturasHoy,
      facturasPendientes > 0 ? "NEED YOU" : facturasHoy > 0 ? "WORKING" : "FREE",
    ),
    desk(
      "FUNCTIONAL_SUPPORT",
      ticketsCriticos > 0,
      ticketsCriticos > 0,
      ticketsCriticos > 0 ? `${ticketsCriticos} tickets alta/crítica` : "SX3 / bugs en calma",
      ticketsCriticos,
      ticketsCriticos > 0 ? "HANDOFF" : "FREE",
    ),
    desk(
      "CUSTOMER_SERVICE",
      ticketsAbiertos > 0,
      false,
      ticketsAbiertos > 0 ? `${ticketsAbiertos} tickets abiertos` : "Cola de soporte vacía",
      ticketsAbiertos,
      ticketsAbiertos > 0 ? "SCAN" : "FREE",
    ),
    desk(
      "SALES",
      pedidosAbiertos > 0,
      false,
      pedidosAbiertos > 0 ? `${pedidosAbiertos} pedidos en curso` : "Sin pedidos abiertos",
      pedidosAbiertos,
      pedidosAbiertos > 0 ? "WORKING" : "FREE",
    ),
    desk(
      "FINANCE",
      cxVencidas > 0,
      cxVencidas > 0,
      cxVencidas > 0 ? `${cxVencidas} CX vencidas` : "Cartera al día",
      cxVencidas,
      cxVencidas > 0 ? "NEED YOU" : "FREE",
    ),
    desk(
      "ACCOUNTING",
      facturasHoy > 0,
      false,
      `${facturasHoy} comprobantes hoy`,
      facturasHoy,
      facturasHoy > 0 ? "WORKING" : "FREE",
    ),
    desk(
      "OPERATIONS",
      lastPedidos.some((p) => p.estado === "en_picking"),
      false,
      lastPedidos.find((p) => p.estado === "en_picking")
        ? `Picking ${lastPedidos.find((p) => p.estado === "en_picking")?.numero}`
        : "Depósito en espera",
      lastPedidos.filter((p) => p.estado === "en_picking").length,
    ),
    desk("INFRASTRUCTURE", true, false, "Postgres / API OK", 1, "FREE"),
  ]

  const events: OfficeLiveEvent[] = []

  for (const f of lastFacturas) {
    events.push({
      departmentId: "BILLING",
      type: f.estado === "emitida" ? "success" : f.estado === "pendiente" ? "warning" : "info",
      title: `Factura ${f.tipo} ${f.puntoVenta}-${f.numero} ${f.estado}`,
      details: f.cae ? `CAE ${f.cae.slice(0, 8)}…` : "Sin CAE todavía",
      targetDoc: `${f.tipo}-${f.puntoVenta}-${f.numero}`,
    })
  }
  for (const t of lastTickets) {
    events.push({
      departmentId: t.modulo === "afip" ? "FUNCTIONAL_SUPPORT" : "CUSTOMER_SERVICE",
      type: t.prioridad === "critica" || t.prioridad === "alta" ? "alert" : "info",
      title: `${t.numero} · ${t.titulo.slice(0, 48)}`,
      details: `${t.estado} / ${t.prioridad}${t.modulo ? ` / ${t.modulo}` : ""}`,
      targetDoc: t.numero,
    })
  }
  for (const p of lastPedidos) {
    events.push({
      departmentId: p.estado === "en_picking" ? "OPERATIONS" : "SALES",
      type: p.estado === "anulado" ? "warning" : "info",
      title: `Pedido ${p.numero} · ${p.estado}`,
      details: "Pedido de venta ERP",
      targetDoc: p.numero,
    })
  }

  const hasSignal = facturasHoy + facturasPendientes + ticketsAbiertos + pedidosAbiertos + cxVencidas > 0 || lastFacturas.length > 0

  return {
    live: hasSignal,
    source: hasSignal ? "erp" : "demo",
    generatedAt: new Date().toISOString(),
    tenantName: empresa?.nombre,
    metrics: {
      facturasHoy,
      facturasPendientes,
      ticketsAbiertos,
      pedidosAbiertos,
      cxVencidas,
      dbOk: true,
    },
    desks,
    events: events.slice(0, 16),
  }
}
