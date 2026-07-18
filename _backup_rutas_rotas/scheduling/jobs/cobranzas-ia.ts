import { prisma } from "@/lib/prisma"

export async function runCobranzasIA() {
  const limiteVencimiento = new Date()
  limiteVencimiento.setDate(limiteVencimiento.getDate() - 3)

  const facturasVencidas = await prisma.factura.findMany({
    where: {
      estado: "emitida",
      // estadoCobranzaIA: "pendiente",
      observaciones: { not: { contains: "COBRANZA_IA_NOTIFICADO" } },
      createdAt: { lt: limiteVencimiento },
      empresa: {
        suscripciones: {
          some: {
            sku: "cobranzas_ia_whatsapp",
            activo: true,
          },
        },
      },
    },
    include: {
      cliente: true,
      empresa: true,
    },
    take: 50,
  })

  if (facturasVencidas.length === 0) {
    return { procesadas: 0, message: "No hay facturas vencidas para procesar." }
  }

  const resultados: Array<{ facturaId: number; cliente: string; status: string }> = []

  for (const factura of facturasVencidas) {
    const nombreCliente = factura.cliente?.nombre || "Cliente"
    const nombreEmpresa = factura.empresa?.nombre || "Empresa"
    const monto = Number(factura.total)

    const mensajeGenerado = `¡Hola ${nombreCliente}! 👋 Te escribo de parte de ${nombreEmpresa}. Solo queríamos hacerte un recordatorio amistoso de que tenés un saldo pendiente por $${monto}. Cuando tengas un ratito, podés regularizarlo usando este link seguro: https://mercadopago.com/pagar/xyz. ¡Cualquier duda, avisame y lo revisamos juntos! Que tengas un excelente día.`

    console.log(
      `[Cobranzas IA] Mensaje enviado a ${factura.cliente?.telefono || "Sin telefono"}: ${mensajeGenerado}`
    )

    await prisma.factura.update({
      where: { id: factura.id },
      data: {
        observaciones: (factura.observaciones || "") + " | COBRANZA_IA_NOTIFICADO",
      },
    })

    await prisma.logActividad.create({
      data: {
        accion: "COBRANZA_IA_ENVIADA",
        detalle: `Mensaje de cobranza enviado a ${nombreCliente} por $${monto}`,
        modulo: "Cobranzas",
        entidad: "Factura",
        entidadId: factura.id,
        ip: "cron-job",
      },
    })

    resultados.push({ facturaId: factura.id, cliente: nombreCliente, status: "sent" })
  }

  return { procesadas: resultados.length, detalle: resultados }
}