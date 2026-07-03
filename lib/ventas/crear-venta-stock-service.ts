/**
 * Venta B2B directa — factura + descuento de stock en una sola transacción.
 */

import { prisma } from "@/lib/prisma"
import {
  assertClienteEmpresa,
  assertProductoEmpresa,
  TenantViolationError,
} from "@/lib/auth/tenant-validate"
import type { z } from "zod"
import type { crearVentaConStockSchema } from "@/lib/schemas/ventas"

export type CrearVentaConStockInput = z.infer<typeof crearVentaConStockSchema>

function calcularLinea(precioUnitario: number, cantidad: number, porcentajeIva = 21) {
  const bruto = precioUnitario * cantidad
  const neto = parseFloat((bruto / (1 + porcentajeIva / 100)).toFixed(2))
  const iva = parseFloat((bruto - neto).toFixed(2))
  return { neto, iva, total: parseFloat(bruto.toFixed(2)) }
}

const TIPO_CBTE: Record<string, number> = { A: 1, B: 6, C: 11 }

export async function crearVentaConStock(empresaId: number, input: CrearVentaConStockInput) {
  await assertClienteEmpresa(input.clienteId, empresaId)

  const productos = await Promise.all(
    input.lineas.map((l) => assertProductoEmpresa(l.productoId, empresaId)),
  )

  const lineasCalc = input.lineas.map((l, i) => {
    const { neto, iva, total } = calcularLinea(l.precioUnitario, l.cantidad)
    return {
      productoId: l.productoId,
      descripcion: productos[i].nombre,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      neto,
      iva,
      total,
    }
  })

  const subtotal = lineasCalc.reduce((s, l) => s + l.neto, 0)
  const ivaTotal = lineasCalc.reduce((s, l) => s + l.iva, 0)
  const total = input.total ?? lineasCalc.reduce((s, l) => s + l.total, 0)

  const tipo = input.tipo ?? "B"
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { puntoVenta: true },
  })
  const puntoVenta = input.puntoVenta ?? empresa?.puntoVenta ?? 1

  return prisma.$transaction(async (tx) => {
    const ultima = await tx.factura.findFirst({
      where: { empresaId, tipo, puntoVenta },
      orderBy: { numero: "desc" },
    })
    const numero = (ultima?.numero ?? 0) + 1

    // A) Cabecera de venta — en Claver es Factura + LineaFactura (no hay modelo Venta)
    const factura = await tx.factura.create({
      data: {
        empresaId,
        clienteId: input.clienteId,
        tipo,
        tipoCbte: TIPO_CBTE[tipo] ?? 6,
        numero,
        puntoVenta,
        subtotal: parseFloat(subtotal.toFixed(2)),
        iva: parseFloat(ivaTotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        estado: "pendiente_cae",
        lineas: {
          create: lineasCalc.map((l) => ({
            productoId: l.productoId,
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            porcentajeIva: 21,
            subtotal: l.neto,
            iva: l.iva,
            total: l.total,
          })),
        },
      },
      include: { lineas: true },
    })

    const ref = `FAC-${tipo}-${String(puntoVenta).padStart(5, "0")}-${String(numero).padStart(8, "0")}`

    // B) Descontar stock — throw dentro del tx → rollback de la factura (defecto 1.2)
    for (const l of lineasCalc) {
      const producto = await tx.producto.findFirst({
        where: { id: l.productoId, empresaId },
        select: { id: true, stock: true, nombre: true },
      })

      if (!producto || producto.stock < l.cantidad) {
        throw new Error(
          producto
            ? `Stock insuficiente para el producto ID: ${l.productoId} ("${producto.nombre}")`
            : `Stock insuficiente para el producto ID: ${l.productoId}`,
        )
      }

      await tx.producto.update({
        where: { id: producto.id },
        data: { stock: { decrement: l.cantidad } },
      })

      if (input.depositoId) {
        const dep = await tx.stockDeposito.findFirst({
          where: { productoId: l.productoId, depositoId: input.depositoId },
        })
        if (dep) {
          const depNuevo = dep.cantidad - l.cantidad
          if (depNuevo < 0) {
            throw new Error(`Stock insuficiente en depósito para "${producto.nombre}"`)
          }
          await tx.stockDeposito.update({
            where: { id: dep.id },
            data: { cantidad: depNuevo },
          })
        }
      }

      await tx.movimientoStock.create({
        data: {
          empresaId,
          productoId: l.productoId,
          tipo: "salida",
          cantidad: l.cantidad,
          motivo: `Venta B2B ${ref}`,
          depositoId: input.depositoId ?? null,
        },
      })
    }

    return factura
  })
}