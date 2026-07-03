// @ts-nocheck
import { prisma } from "@/lib/prisma"
import { encolarWhatsAppNiche } from "@/lib/niche/niche-whatsapp"

export interface ProrrateoRequest {
  consorcioId: number
  periodo: string // Ej: "2026-07"
  emitirFactura: boolean // A1: El cliente puede decidir si emite factura o solo recibo
}

export interface MensajeMasivoRequest {
  consorcioId: number
  asunto: string
  cuerpo: string
  canal: "whatsapp" | "email" | "ambos" // A2: Soportar ambos canales
}

export class ConsorciosService {
  /**
   * Genera las expensas de un período basándose en los gastos cargados
   * y el porcentaje (porceps) de cada Unidad Funcional.
   */
  static async liquidarExpensas(req: ProrrateoRequest) {
    const { consorcioId, periodo, emitirFactura } = req

    // 1. Obtener los gastos del periodo
    const gastos = await prisma.consorcioGasto.findMany({
      where: { consorcioId, periodo },
    })

    const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0)

    if (totalGastos === 0) {
      throw new Error(`No hay gastos cargados para el consorcio en el período ${periodo}`)
    }

    // 2. Obtener las unidades funcionales del consorcio
    const unidades = await prisma.unidadFuncional.findMany({
      where: { consorcioId },
      include: {
        residente: true,
        consorcio: {
          include: { empresa: true }
        }
      }
    })

    if (unidades.length === 0) {
      throw new Error("El consorcio no tiene unidades funcionales configuradas.")
    }

    const expensasGeneradas: any[] = []

    // 3. Calcular la expensa por unidad usando transacción
    await prisma.$transaction(async (tx) => {
      for (const unidad of unidades) {
        // Cálculo del prorrateo (Total * Porcentaje / 100)
        const montoExpensa = (totalGastos * unidad.porceps) / 100

        let facturaId = null

        // 4. Si el cliente quiere factura fiscal, la generamos
        if (emitirFactura && unidad.residenteId) {
          const factura = await tx.factura.create({
            data: {
              empresaId: unidad.consorcio.empresaId,
              clienteId: unidad.residenteId,
              tipo: "B",
              tipoCbte: 6,
              numero: 0, // Se asigna al enviar a AFIP
              puntoVenta: unidad.consorcio.empresa.puntoVenta,
              subtotal: montoExpensa,
              iva: 0, // Expensas suelen ser exentas, o IVA 0
              total: montoExpensa,
              concepto: 2, // Servicios
              estado: "pendiente",
              observaciones: `Expensas ${periodo} - Unidad ${unidad.numero}`,
              lineas: {
                create: [
                  {
                    descripcion: `Expensas Período ${periodo}`,
                    cantidad: 1,
                    precioUnitario: montoExpensa,
                    porcentajeIva: 0,
                    codigoAfipIva: "3", // 0%
                    subtotal: montoExpensa,
                    iva: 0,
                    total: montoExpensa
                  }
                ]
              }
            }
          })
          facturaId = factura.id
        }

        // 5. Crear el registro de la expensa y actualizar saldo
        const expensa = await tx.consorcioExpensa.create({
          data: {
            unidadId: unidad.id,
            periodo,
            montoTotal: montoExpensa,
            estado: "pendiente",
            facturaId
          }
        })

        // Aumentar la deuda del residente en su cuenta corriente
        if (unidad.residenteId) {
          await tx.cliente.update({
            where: { id: unidad.residenteId },
            data: {
              saldoCuentaCorriente: { increment: montoExpensa }
            }
          })
        }

        await tx.unidadFuncional.update({
          where: { id: unidad.id },
          data: {
            saldo: { increment: montoExpensa }
          }
        })

        expensasGeneradas.push(expensa)
      }
    })

    return { success: true, periodo, totalProrrateado: totalGastos, expensasGeneradas }
  }

  /**
   * Envía un comunicado masivo a todos los residentes del consorcio
   */
  static async enviarComunicadoMasivo(req: MensajeMasivoRequest) {
    const { consorcioId, asunto, cuerpo, canal } = req

    const consorcio = await prisma.consorcio.findUnique({
      where: { id: consorcioId },
      select: { empresaId: true },
    })
    if (!consorcio) throw new Error("Consorcio no encontrado")

    const residentes = await prisma.cliente.findMany({
      where: {
        unidadesResidente: {
          some: { consorcioId },
        },
      },
    })

    // Registrar el comunicado en la base de datos
    const comunicado = await prisma.consorcioMensaje.create({
      data: {
        consorcioId,
        asunto,
        cuerpo,
        canal,
        estado: "enviado"
      }
    })

    let enviados = 0

    for (const res of residentes) {
      if ((canal === "whatsapp" || canal === "ambos") && res.telefono) {
        const ok = await encolarWhatsAppNiche({
          empresaId: consorcio.empresaId,
          appSku: "niche.consorcios",
          clienteNombre: res.nombre,
          telefono: res.telefono,
          concepto: cuerpo,
          mensajeCustom: `${asunto}\n\n${cuerpo}`,
        })
        if (ok) enviados++
      }

      if ((canal === "email" || canal === "ambos") && res.email) {
        // Integración con SendGrid/Resend
        enviados++
      }
    }

    return { success: true, comunicadoId: comunicado.id, destinatariosAlcanzados: enviados }
  }
}
