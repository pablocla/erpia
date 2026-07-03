import { z } from "zod"

/** Línea de pedido / venta B2B */
export const lineaVentaSchema = z.object({
  productoId: z.number().int().positive().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive().optional(),
})

/** Alta de pedido de venta (borrador) */
export const crearPedidoVentaSchema = z.object({
  clienteId: z.number().int().positive(),
  vendedorId: z.number().int().positive().optional(),
  condicionPagoId: z.number().int().positive().optional(),
  canalVentaId: z.number().int().positive().optional(),
  fechaEntregaEst: z.string().date().optional(),
  observaciones: z.string().optional(),
  lineas: z.array(lineaVentaSchema).min(1, "La venta debe tener al menos un producto"),
})

/** Acciones sobre pedido existente */
export const pedidoVentaActionSchema = z.object({
  action: z.enum(["confirmar", "picking", "remito", "anular", "facturar", "clonar"]),
  pedidoId: z.number().int().positive(),
  depositoId: z.number().int().positive().optional(),
  tipo: z.enum(["A", "B", "C"]).optional(),
  tipoCbte: z.number().int().optional(),
  puntoVenta: z.number().int().positive().optional(),
  cae: z.string().optional(),
  condicionPagoId: z.number().int().positive().optional(),
})

/** Contrato simplificado (doc hardening) — venta directa con stock */
export const crearVentaConStockSchema = z.object({
  clienteId: z.number().int().positive(),
  total: z.number().positive().optional(),
  tipo: z.enum(["A", "B", "C"]).default("B"),
  puntoVenta: z.number().int().positive().optional(),
  depositoId: z.number().int().positive().optional(),
  lineas: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        cantidad: z.number().positive(),
        precioUnitario: z.number().min(0),
      }),
    )
    .min(1, "La venta debe tener al menos un producto"),
})

export type CrearPedidoVentaInput = z.infer<typeof crearPedidoVentaSchema>
export type PedidoVentaActionInput = z.infer<typeof pedidoVentaActionSchema>