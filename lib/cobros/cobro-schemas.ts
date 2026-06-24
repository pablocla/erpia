import { z } from "zod"

export const chequeCobroSchema = z.object({
  numero: z.string().min(1, "Número de cheque requerido"),
  monto: z.number().positive().optional(),
  fechaEmision: z.string().min(1, "Fecha de emisión requerida"),
  fechaVencimiento: z.string().min(1, "Fecha de vencimiento requerida"),
  cuitBancoLibrador: z.string().optional(),
  bancoNombre: z.string().optional(),
  observaciones: z.string().optional(),
})

export const cobroSchema = z.object({
  clienteId: z.number().int().positive(),
  items: z.array(z.object({
    cuentaCobrarId: z.number().int().positive(),
    monto: z.number().positive("El monto debe ser positivo"),
  })).min(1),
  medioPago: z.enum(["efectivo", "transferencia", "cheque", "tarjeta"]),
  fecha: z.string().optional(),
  observaciones: z.string().optional(),
  cheque: chequeCobroSchema.optional(),
  retenciones: z.object({
    retencionIVA: z.number().min(0).optional(),
    retencionGanancias: z.number().min(0).optional(),
    retencionIIBB: z.number().min(0).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.medioPago === "cheque" && !data.cheque) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Datos del cheque requeridos", path: ["cheque"] })
  }
})

/** Formato legacy desde UI de CC (un solo ítem) */
export const cobroLegacySchema = z.object({
  cuentaCobrarId: z.number().int().positive(),
  monto: z.number().positive(),
  medioPago: z.enum(["efectivo", "transferencia", "cheque", "tarjeta"]),
  fecha: z.string().optional(),
  observaciones: z.string().optional(),
  cheque: chequeCobroSchema.optional(),
  retenciones: z.object({
    retencionIVA: z.number().min(0).optional(),
    retencionGanancias: z.number().min(0).optional(),
    retencionIIBB: z.number().min(0).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.medioPago === "cheque" && !data.cheque) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Datos del cheque requeridos", path: ["cheque"] })
  }
})