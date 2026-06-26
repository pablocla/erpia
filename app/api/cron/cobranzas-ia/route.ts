import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Habilitar para que Vercel lo ejecute como Edge/Serverless Cron
export const maxDuration = 60 // 1 minuto máx

export async function GET(request: Request) {
  // En producción, Vercel envía un header secreto para proteger los crons.
  // if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new NextResponse('Unauthorized', { status: 401 })
  // }

  try {
    const hoy = new Date()
    
    // 1. Buscar facturas vencidas (simulado: concepto 2 o 3 con fechaVtoPago vencida, o simplemente facturas viejas)
    // Para la demo, buscaremos facturas creadas hace más de 3 días que aún están en "emitida" y estadoCobranzaIA "pendiente"
    const limiteVencimiento = new Date()
    limiteVencimiento.setDate(limiteVencimiento.getDate() - 3)

    const facturasVencidas = await prisma.factura.findMany({
      where: {
        estado: "emitida",
        estadoCobranzaIA: "pendiente",
        // En un caso real buscaríamos por fechaVtoPago o cruzado con CuentaCobrar
        createdAt: {
          lt: limiteVencimiento
        },
        empresa: {
          // Solo ejecutar en empresas que tengan la suscripción de Cobranzas IA activa
          suscripciones: {
            some: {
              sku: "cobranzas_ia_whatsapp",
              activo: true
            }
          }
        }
      },
      include: {
        cliente: true,
        empresa: true
      },
      take: 50 // Procesar en lotes
    })

    if (facturasVencidas.length === 0) {
      return NextResponse.json({ success: true, message: "No hay facturas vencidas para procesar." })
    }

    const resultados = []

    // 2. Procesar cada factura con IA (Simulación del prompt)
    for (const factura of facturasVencidas) {
      const nombreCliente = factura.cliente.nombre || "Cliente"
      const nombreEmpresa = factura.empresa.nombre
      const monto = Number(factura.total)

      // Prompt para la IA:
      const promptText = `
        Sos la Secretaria Virtual de Cobranzas de la empresa "${nombreEmpresa}". 
        Debes enviarle un mensaje corto y amable por WhatsApp a "${nombreCliente}" recordándole que 
        tiene una factura vencida por $${monto}. 
        El mensaje debe incluir un link de pago simulado (ej: https://mercadopago.com/pagar/xyz). 
        No suenes agresivo, es un primer aviso (recordatorio amistoso).
      `

      // Aquí invocaríamos a OpenAI:
      // const { text } = await generateText({
      //   model: openai('gpt-4o-mini'),
      //   prompt: promptText
      // })
      // Para asegurar que corra sin token real en el local, hacemos un mock inteligente:
      const mensajeGenerado = `¡Hola ${nombreCliente}! 👋 Te escribo de parte de ${nombreEmpresa}. Solo queríamos hacerte un recordatorio amistoso de que tenés un saldo pendiente por $${monto}. Cuando tengas un ratito, podés regularizarlo usando este link seguro: https://mercadopago.com/pagar/xyz. ¡Cualquier duda, avisame y lo revisamos juntos! Que tengas un excelente día.`

      // 3. Simular envío por WhatsApp API (ej. Twilio, Meta API)
      console.log(`[Cobranzas IA] Mensaje enviado a ${factura.cliente.telefono || 'Sin telefono'}: ${mensajeGenerado}`)

      // 4. Actualizar estado de la factura
      await prisma.factura.update({
        where: { id: factura.id },
        data: {
          estadoCobranzaIA: "notificado_1",
          ultimaNotificacionCobro: new Date()
        }
      })

      // 5. Registrar en Log de Actividad
      await prisma.logActividad.create({
        data: {
          empresaId: factura.empresaId,
          accion: "COBRANZA_IA_ENVIADA",
          descripcion: `Mensaje de cobranza enviado a ${nombreCliente} por $${monto}`,
          modulo: "Cobranzas",
          entidadId: factura.id,
          ip: "cron-job"
        }
      })

      resultados.push({ facturaId: factura.id, cliente: nombreCliente, status: "sent" })
    }

    return NextResponse.json({ 
      success: true, 
      procesadas: resultados.length,
      detalle: resultados 
    })

  } catch (error: any) {
    console.error("Error en Cobranzas IA Cron:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
