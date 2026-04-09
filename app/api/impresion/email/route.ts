/**
 * POST /api/impresion/email — Send comprobante by email
 * GET  /api/impresion/email — Check email configuration status
 */
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { emailService } from "@/lib/email/email-service"
import { z } from "zod"

const enviarSchema = z.object({
  tipo: z.enum(["factura", "nota-credito", "custom"]),
  id: z.number().int().positive().optional(),
  html: z.string().optional(),
  to: z.string().email().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  return NextResponse.json({
    configured: emailService.isConfigured(),
    smtpHost: process.env.SMTP_HOST ? `${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}` : null,
  })
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = enviarSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { tipo, id, html, to, subject, body: emailBody } = validacion.data

    let result

    switch (tipo) {
      case "factura":
        if (!id) return NextResponse.json({ error: "id requerido para factura" }, { status: 400 })
        result = await emailService.enviarFactura(id, html || "")
        break

      case "nota-credito":
        if (!id) return NextResponse.json({ error: "id requerido para nota-credito" }, { status: 400 })
        result = await emailService.enviarNotaCredito(id, html || "")
        break

      case "custom":
        if (!to || !subject || !emailBody) {
          return NextResponse.json({ error: "to, subject y body requeridos" }, { status: 400 })
        }
        result = await emailService.notificar(to, subject, emailBody)
        break
    }

    if (result?.ok) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    }

    return NextResponse.json({ error: result?.error || "Error al enviar email" }, { status: 500 })
  } catch (error) {
    console.error("Error en POST /api/impresion/email:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
