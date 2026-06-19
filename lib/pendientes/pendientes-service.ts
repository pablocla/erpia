/**
 * Pendientes del sistema por rol — bandeja unificada
 */
import { prisma } from "@/lib/prisma"

export type PrioridadPendiente = "bloqueante" | "alta" | "media" | "baja"

export interface PendienteSistema {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  prioridad: PrioridadPendiente
  href?: string
  accion?: string
  origen: "sistema" | "manual"
}

export async function listarPendientesPorRol(
  empresaId: number,
  rol: string,
  userId?: number
): Promise<PendienteSistema[]> {
  const pendientes: PendienteSistema[] = []

  // ── Cajero / POS ─────────────────────────────────────────────────────────
  if (["cajero", "dueno", "gerente", "admin"].includes(rol)) {
    const cajaAbierta = await prisma.caja.findFirst({
      where: { empresaId, estado: "abierta" },
    })
    if (!cajaAbierta) {
      pendientes.push({
        id: "caja-cerrada",
        tipo: "caja",
        titulo: "Caja cerrada",
        descripcion: "Abrí la caja antes de vender en el POS.",
        prioridad: "bloqueante",
        href: "/dashboard/caja",
        accion: "Abrir caja",
        origen: "sistema",
      })
    }

    const facturasSinCae = await prisma.factura.count({
      where: { empresaId, estado: "pendiente_cae" },
    })
    if (facturasSinCae > 0) {
      pendientes.push({
        id: "cae-pendiente",
        tipo: "fiscal",
        titulo: `${facturasSinCae} comprobante(s) sin CAE`,
        descripcion: "Reintentá la emisión AFIP o corregí el certificado.",
        prioridad: "alta",
        href: "/dashboard/facturas",
        accion: "Reintentar CAE",
        origen: "sistema",
      })
    }

    if (cajaAbierta) {
      const inicioDia = new Date()
      inicioDia.setHours(0, 0, 0, 0)

      const [jornadaAbierta, ventasHoy] = await Promise.all([
        prisma.jornadaFiscal.findFirst({
          where: { empresaId, estado: "abierta", fecha: { gte: inicioDia } },
        }),
        prisma.factura.count({
          where: { empresaId, createdAt: { gte: inicioDia } },
        }),
      ])

      const horaCierreSugerida = new Date().getHours() >= 20
      const cajaLarga = new Date(cajaAbierta.fecha).getTime() <
        Date.now() - 10 * 60 * 60 * 1000

      if (jornadaAbierta && ventasHoy > 0 && (horaCierreSugerida || cajaLarga)) {
        pendientes.push({
          id: "cierre-z-sugerido",
          tipo: "caja",
          titulo: "Cierre Z pendiente",
          descripcion: `${ventasHoy} venta(s) hoy — cerrá el turno antes de irte.`,
          prioridad: "media",
          href: "/dashboard/pos/cierre",
          accion: "Ir a cierre",
          origen: "sistema",
        })
      }
    }
  }

  // ── Depósito ─────────────────────────────────────────────────────────────
  if (["deposito", "gerente", "dueno", "admin"].includes(rol)) {
    const pickingAbiertos = await prisma.listaPicking.count({
      where: { empresaId, estado: { in: ["pendiente", "en_proceso"] as string[] } },
    })
    if (pickingAbiertos > 0) {
      pendientes.push({
        id: "picking-abierto",
        tipo: "picking",
        titulo: `${pickingAbiertos} lista(s) de picking abiertas`,
        descripcion: "Hay órdenes esperando preparación en depósito.",
        prioridad: "alta",
        href: "/dashboard/picking",
        accion: "Ir a picking",
        origen: "sistema",
      })
    }

    const productosStock = await prisma.producto.findMany({
      where: { empresaId, activo: true },
      select: { stock: true, stockMinimo: true },
    }).catch(() => [])
    const stockBajo = productosStock.filter(
      (p) => Number(p.stock) <= Number(p.stockMinimo ?? 5)
    ).length

    if (stockBajo > 0) {
      pendientes.push({
        id: "stock-critico",
        tipo: "stock",
        titulo: `${stockBajo} producto(s) con stock bajo`,
        descripcion: "Revisá reposición o generá orden de compra.",
        prioridad: "media",
        href: "/dashboard/productos",
        accion: "Ver stock",
        origen: "sistema",
      })
    }
  }

  // ── Gerente / Dueño ──────────────────────────────────────────────────────
  if (["gerente", "dueno", "admin"].includes(rol)) {
    const aprobaciones = await prisma.solicitudAprobacion.count({
      where: { empresaId, estado: "pendiente" },
    }).catch(() => 0)

    if (aprobaciones > 0) {
      pendientes.push({
        id: "aprobaciones-pendientes",
        tipo: "aprobacion",
        titulo: `${aprobaciones} aprobación(es) pendiente(s)`,
        descripcion: "Compras, descuentos o NC esperan tu decisión.",
        prioridad: "alta",
        href: "/dashboard/aprobaciones",
        accion: "Revisar",
        origen: "sistema",
      })
    }

    const cajasViejas = await prisma.caja.count({
      where: {
        empresaId,
        estado: "abierta",
        fecha: { lt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      },
    }).catch(() => 0)

    if (cajasViejas > 0) {
      pendientes.push({
        id: "cajas-viejas",
        tipo: "caja",
        titulo: `${cajasViejas} caja(s) abierta(s) > 12 h`,
        descripcion: "Cerrá o arqueá los turnos vencidos.",
        prioridad: "media",
        href: "/dashboard/caja",
        accion: "Ver cajas",
        origen: "sistema",
      })
    }
  }

  // ── Contador ─────────────────────────────────────────────────────────────
  if (["contador", "dueno", "admin"].includes(rol)) {
    const periodoAbierto = await prisma.periodoFiscal.findFirst({
      where: { empresaId, estado: "abierto" },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    }).catch(() => null)

    if (periodoAbierto) {
      pendientes.push({
        id: "periodo-fiscal-abierto",
        tipo: "fiscal",
        titulo: "Período fiscal abierto",
        descripcion: `Revisá cierre del período ${periodoAbierto.mes}/${periodoAbierto.anio}.`,
        prioridad: "media",
        href: "/dashboard/contabilidad/periodos",
        accion: "Ver períodos",
        origen: "sistema",
      })
    }
  }

  // ── Vendedor ─────────────────────────────────────────────────────────────
  if (["vendedor_ruta", "gerente", "dueno", "admin"].includes(rol)) {
    const presupuestosVencer = await prisma.presupuesto.count({
      where: {
        empresaId,
        estado: "enviado",
        fechaVencimiento: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      },
    }).catch(() => 0)

    if (presupuestosVencer > 0) {
      pendientes.push({
        id: "presupuestos-vencer",
        tipo: "ventas",
        titulo: `${presupuestosVencer} presupuesto(s) por vencer`,
        descripcion: "Seguimiento comercial pendiente.",
        prioridad: "media",
        href: "/dashboard/ventas/presupuestos",
        accion: "Ver presupuestos",
        origen: "sistema",
      })
    }
  }

  // ── Tareas manuales del usuario ──────────────────────────────────────────
  if (userId) {
    const tareas = await prisma.tareaPendiente.findMany({
      where: { empresaId, usuarioId: userId, completada: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => [])

    for (const t of tareas) {
      pendientes.push({
        id: `tarea-${t.id}`,
        tipo: "tarea",
        titulo: t.titulo,
        descripcion: t.descripcion ?? "",
        prioridad: (t.prioridad as PrioridadPendiente) ?? "media",
        href: "/dashboard/mis-tareas",
        origen: "manual",
      })
    }
  }

  const orden: Record<PrioridadPendiente, number> = {
    bloqueante: 0,
    alta: 1,
    media: 2,
    baja: 3,
  }

  return pendientes.sort((a, b) => orden[a.prioridad] - orden[b.prioridad])
}