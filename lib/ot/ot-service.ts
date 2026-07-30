import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type CreateOTInput = {
  clienteId: number
  numero?: string
  estado?: string
  titulo?: string
  descripcion?: string
  fechaPrometida?: Date | string
  tecnicoAsignado?: string
  metadata?: Prisma.InputJsonValue
  items?: {
    productoId?: number
    descripcion: string
    cantidad: number
    precioUnitario: number
    tipo: "REPUESTO" | "MANO_OBRA"
  }[]
}

export class OTService {
  async nextNumero(empresaId: number, tx?: Prisma.TransactionClient): Promise<string> {
    const db = tx ?? prisma
    const count = await db.ordenServicio.count({ where: { empresaId } })
    return `OS-${String(count + 1).padStart(4, "0")}`
  }

  async crearOrden(empresaId: number, input: CreateOTInput) {
    const items = input.items ?? []
    const total = items.reduce(
      (acc, item) => acc + Number(item.cantidad) * Number(item.precioUnitario),
      0,
    )

    const fechaPrometida =
      input.fechaPrometida == null
        ? undefined
        : input.fechaPrometida instanceof Date
          ? input.fechaPrometida
          : new Date(input.fechaPrometida)

    return await prisma.$transaction(async (tx) => {
      const numero = input.numero?.trim() || (await this.nextNumero(empresaId, tx))

      const orden = await tx.ordenServicio.create({
        data: {
          empresaId,
          clienteId: input.clienteId,
          numero,
          estado: input.estado ?? "PENDIENTE",
          titulo: input.titulo,
          descripcion: input.descripcion,
          fechaPrometida,
          tecnicoAsignado: input.tecnicoAsignado,
          metadata: input.metadata ?? {},
          total,
          items: items.length
            ? {
                create: items.map((item) => ({
                  productoId: item.productoId,
                  descripcion: item.descripcion,
                  cantidad: item.cantidad,
                  precioUnitario: item.precioUnitario,
                  tipo: item.tipo,
                })),
              }
            : undefined,
        },
        include: {
          items: true,
          cliente: { select: { id: true, nombre: true, telefono: true, direccion: true } },
        },
      })

      for (const item of items) {
        if (item.tipo === "REPUESTO" && item.productoId) {
          const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
          if (prod && prod.tipoProducto !== "servicio") {
            await tx.producto.update({
              where: { id: prod.id },
              data: { stock: { decrement: item.cantidad } },
            })
          }
        }
      }

      return orden
    })
  }

  async listarOrdenes(empresaId: number, filters?: { clienteId?: number; estado?: string }) {
    return prisma.ordenServicio.findMany({
      where: {
        empresaId,
        activo: true,
        ...(filters?.clienteId && { clienteId: filters.clienteId }),
        ...(filters?.estado && { estado: filters.estado }),
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            direccion: true,
            direccionComplemento: true,
          },
        },
        items: true,
      },
      orderBy: { fechaCreacion: "desc" },
    })
  }

  async cambiarEstado(empresaId: number, ordenId: number, nuevoEstado: string) {
    const existing = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, empresaId, activo: true },
    })
    if (!existing) throw new Error("Orden no encontrada")
    return prisma.ordenServicio.update({
      where: { id: ordenId },
      data: { estado: nuevoEstado },
    })
  }

  async actualizarOrden(
    empresaId: number,
    ordenId: number,
    patch: {
      estado?: string
      tecnicoAsignado?: string | null
      fechaPrometida?: Date | string | null
      descripcion?: string | null
      titulo?: string
      metadata?: Record<string, unknown>
    },
  ) {
    const existing = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, empresaId, activo: true },
    })
    if (!existing) throw new Error("Orden de servicio no encontrada")

    const updateData: Record<string, unknown> = {}
    if (patch.estado !== undefined) updateData.estado = patch.estado
    if (patch.tecnicoAsignado !== undefined) updateData.tecnicoAsignado = patch.tecnicoAsignado
    if (patch.titulo !== undefined) updateData.titulo = patch.titulo
    if (patch.descripcion !== undefined) updateData.descripcion = patch.descripcion

    if (patch.fechaPrometida !== undefined) {
      updateData.fechaPrometida =
        patch.fechaPrometida === null || patch.fechaPrometida === ""
          ? null
          : patch.fechaPrometida instanceof Date
            ? patch.fechaPrometida
            : new Date(patch.fechaPrometida)
    }

    if (patch.metadata !== undefined) {
      const prevMeta = (existing.metadata ?? {}) as Record<string, unknown>
      updateData.metadata = { ...prevMeta, ...patch.metadata }

      const meta = patch.metadata as Record<string, unknown>
      const newStatus = patch.estado || existing.estado
      
      // Impacto en Stock de Insumos Consumidos
      if (meta.insumosConsumidos && Array.isArray(meta.insumosConsumidos) && !prevMeta.stockDescontado && (newStatus === "LISTO" || newStatus === "ENTREGADO")) {
        try {
          const txStock = meta.insumosConsumidos
            .filter((i: any) => i.productoId && Number(i.cantidad) > 0)
            .map((insumo: any) => prisma.producto.update({
              where: { id: Number(insumo.productoId), empresaId },
              data: { stock: { decrement: Number(insumo.cantidad) } }
            }))
          if (txStock.length > 0) {
            await prisma.$transaction(txStock)
            // Save flag to prevent double discounting
            updateData.metadata = { ...(updateData.metadata as object), stockDescontado: true }
          }
        } catch (e) {
          console.error("Error al descontar stock", e)
        }
      }

      // Impacto en Cuentas por Cobrar si el cobro queda PENDIENTE_PAGO y tiene monto
      const monto = Number(meta.montoCobrado ?? 0)
      if (meta.estadoPago === "PENDIENTE_PAGO" && monto > 0 && !meta.cuentaCobrarGeneradaId) {
        try {
          const fechaVenc = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días por defecto

          const cxc = await prisma.cuentaCobrar.create({
            data: {
              clienteId: existing.clienteId,
              montoOriginal: monto,
              saldo: monto,
              fechaEmision: new Date(),
              fechaVencimiento: fechaVenc,
              estado: "pendiente",
              observaciones: `Servicio de Fumigación OT #${existing.numero}`,
            },
          })
          
          updateData.metadata = {
            ...(updateData.metadata as object),
            cuentaCobrarGeneradaId: cxc.id
          }
        } catch (e) {
          console.error("[OTService] No se pudo generar automatismo de CuentaCobrar:", e)
        }
      }
    }

    return prisma.ordenServicio.update({
      where: { id: ordenId },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            direccion: true,
            direccionComplemento: true,
          },
        },
        items: true,
      },
    })
  }

  async obtenerPorId(empresaId: number, ordenId: number) {
    return prisma.ordenServicio.findFirst({
      where: { id: ordenId, empresaId, activo: true },
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true, condicionIva: true } },
        items: true,
      },
    })
  }

  /**
   * Facturación 1-click: OT → Factura (borrador pendiente_cae).
   * Repuestos y mano de obra se mapean a líneas con IVA 21% por defecto.
   * No solicita CAE síncrono aquí — el caller puede llamar intentarCaeConContingencia.
   */
  async facturar(
    empresaId: number,
    ordenId: number,
    opts?: { tipo?: "A" | "B" | "C"; alicuotaIva?: number; solicitarCae?: boolean },
  ) {
    const orden = await this.obtenerPorId(empresaId, ordenId)
    if (!orden) throw new Error("Orden de trabajo no encontrada")
    if (orden.estado === "CANCELADO") throw new Error("No se puede facturar una OT cancelada")
    if (orden.estado === "FACTURADA") {
      const meta = (orden.metadata ?? {}) as Record<string, unknown>
      if (typeof meta.facturaId === "number") {
        const existente = await prisma.factura.findFirst({
          where: { id: meta.facturaId, empresaId },
          include: { lineas: true },
        })
        if (existente) return { factura: existente, yaFacturada: true as const }
      }
      throw new Error("La OT ya está facturada")
    }
    if (!orden.items.length) throw new Error("La OT no tiene ítems para facturar")

    const tipo = opts?.tipo ?? "B"
    const alicuota = opts?.alicuotaIva ?? 21
    const TIPO_CBTE: Record<string, number> = { A: 1, B: 6, C: 11 }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { puntoVenta: true },
    })
    const puntoVenta = empresa?.puntoVenta ?? 1

    const lineasCalc = orden.items.map((item) => {
      const cantidad = Number(item.cantidad)
      const precioUnitario = Number(item.precioUnitario)
      const bruto = cantidad * precioUnitario
      const neto = parseFloat((bruto / (1 + alicuota / 100)).toFixed(2))
      const iva = parseFloat((bruto - neto).toFixed(2))
      const tipoLabel = item.tipo === "MANO_OBRA" ? "Mano de obra" : "Repuesto"
      return {
        productoId: item.productoId ?? undefined,
        descripcion: `[${tipoLabel}] ${item.descripcion}`.slice(0, 200),
        cantidad,
        precioUnitario,
        porcentajeIva: alicuota,
        subtotal: neto,
        iva,
        total: parseFloat(bruto.toFixed(2)),
      }
    })

    const subtotal = lineasCalc.reduce((s, l) => s + l.subtotal, 0)
    const ivaTotal = lineasCalc.reduce((s, l) => s + l.iva, 0)
    const total = lineasCalc.reduce((s, l) => s + l.total, 0)

    const factura = await prisma.$transaction(async (tx) => {
      const ultima = await tx.factura.findFirst({
        where: { empresaId, tipo, puntoVenta },
        orderBy: { numero: "desc" },
      })
      const numero = (ultima?.numero ?? 0) + 1

      const fac = await tx.factura.create({
        data: {
          empresaId,
          clienteId: orden.clienteId,
          tipo,
          tipoCbte: TIPO_CBTE[tipo] ?? 6,
          numero,
          puntoVenta,
          subtotal: parseFloat(subtotal.toFixed(2)),
          iva: parseFloat(ivaTotal.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          estado: "pendiente_cae",
          concepto: 3,
          observaciones: `Facturado desde OT #${orden.numero}`,
          lineas: {
            create: lineasCalc.map((l) => ({
              productoId: l.productoId,
              descripcion: l.descripcion,
              cantidad: l.cantidad,
              precioUnitario: l.precioUnitario,
              porcentajeIva: l.porcentajeIva,
              subtotal: l.subtotal,
              iva: l.iva,
              total: l.total,
            })),
          },
        },
        include: { lineas: true },
      })

      const prevMeta = (orden.metadata ?? {}) as Record<string, unknown>
      await tx.ordenServicio.update({
        where: { id: ordenId },
        data: {
          estado: "FACTURADA",
          metadata: {
            ...prevMeta,
            facturaId: fac.id,
            facturadoAt: new Date().toISOString(),
          },
        },
      })

      return fac
    })

    let caeResult: { ok: boolean; cae?: string; error?: string } | undefined
    if (opts?.solicitarCae !== false) {
      try {
        const { intentarCaeConContingencia } = await import("@/lib/afip/afip-contingency-service")
        const r = await intentarCaeConContingencia(factura.id, empresaId)
        caeResult = {
          ok: r.estado === "CAE_APROBADO",
          cae: r.cae,
          error: r.error,
        }
        if (r.cae) {
          const updated = await prisma.factura.findUnique({
            where: { id: factura.id },
            include: { lineas: true },
          })
          return {
            factura: updated ?? factura,
            yaFacturada: false as const,
            caeResult,
            printUrl: `/dashboard/facturas/${factura.id}`,
          }
        }
      } catch (e) {
        caeResult = {
          ok: false,
          error: e instanceof Error ? e.message : "Error al solicitar CAE",
        }
      }
    }

    return {
      factura,
      yaFacturada: false as const,
      caeResult,
      printUrl: `/dashboard/facturas/${factura.id}`,
    }
  }
}
