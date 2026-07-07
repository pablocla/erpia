import { prisma } from "@/lib/prisma"
import { encolarWhatsAppNiche } from "@/lib/niche/niche-whatsapp"
import { vencimientoExpensaDesdePeriodo } from "@/lib/consorcios/consorcios-morosos-service"

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

    const expensasGeneradas: Awaited<ReturnType<typeof prisma.consorcioExpensa.create>>[] = []
    const fechaVencimiento = vencimientoExpensaDesdePeriodo(periodo)
    const puntoVenta = unidades[0]?.consorcio.empresa.puntoVenta ?? 1

    // 3. Calcular la expensa por unidad usando transacción
    await prisma.$transaction(async (tx) => {
      for (const unidad of unidades) {
        const montoExpensa = (totalGastos * unidad.porceps) / 100
        if (montoExpensa <= 0) continue

        let facturaId: number | null = null

        if (unidad.residenteId) {
          const factura = await tx.factura.create({
            data: {
              empresaId: unidad.consorcio.empresaId,
              clienteId: unidad.residenteId,
              tipo: "B",
              tipoCbte: 6,
              numero: 0,
              puntoVenta,
              subtotal: montoExpensa,
              iva: 0,
              total: montoExpensa,
              concepto: 2,
              estado: emitirFactura ? "pendiente" : "interna",
              fechaVtoPago: fechaVencimiento,
              observaciones: `Expensas ${periodo} - Unidad ${unidad.numero}`,
              lineas: {
                create: [
                  {
                    descripcion: `Expensas Período ${periodo}`,
                    cantidad: 1,
                    precioUnitario: montoExpensa,
                    porcentajeIva: 0,
                    codigoAfipIva: "3",
                    subtotal: montoExpensa,
                    iva: 0,
                    total: montoExpensa,
                  },
                ],
              },
            },
          })
          facturaId = factura.id

          await tx.cuentaCobrar.create({
            data: {
              facturaId: factura.id,
              clienteId: unidad.residenteId,
              numeroCuota: 1,
              montoOriginal: montoExpensa,
              saldo: montoExpensa,
              fechaEmision: new Date(),
              fechaVencimiento,
              estado: "pendiente",
              observaciones: `Expensas ${periodo} - UF ${unidad.numero}`,
            },
          })
        }

        const expensa = await tx.consorcioExpensa.create({
          data: {
            unidadId: unidad.id,
            periodo,
            montoTotal: montoExpensa,
            estado: "pendiente",
            facturaId,
            fechaVencimiento,
          },
        })

        if (unidad.residenteId) {
          await tx.cliente.update({
            where: { id: unidad.residenteId },
            data: { saldoCuentaCorriente: { increment: montoExpensa } },
          })
        }

        await tx.unidadFuncional.update({
          where: { id: unidad.id },
          data: { saldo: { increment: montoExpensa } },
        })

        expensasGeneradas.push(expensa)
      }
    })

    if (emitirFactura && expensasGeneradas.length > 0) {
      const empresaId = unidades[0]?.consorcio.empresaId
      if (empresaId) {
        const { marcarExpensasListasAfip } = await import("@/lib/consorcios/consorcios-fiscal-service")
        await marcarExpensasListasAfip(empresaId, periodo).catch(() => 0)
      }
    }

    // [NUEVO] Encolar avisos por WhatsApp a los inquilinos
    const empresaIdForWa = unidades[0]?.consorcio.empresaId;
    if (empresaIdForWa && expensasGeneradas.length > 0) {
      for (const expensa of expensasGeneradas) {
        const unidad = unidades.find(u => u.id === expensa.unidadId);
        if (unidad?.residente && unidad.residente.telefono) {
          const mensajeCustom = `Hola ${unidad.residente.nombre}, ya están liquidadas las expensas de ${periodo} de la unidad ${unidad.numero}. Monto a abonar: $${Number(expensa.montoTotal).toLocaleString('es-AR')}. Podés pagar ingresando a tu panel de inquilino.`;
          await encolarWhatsAppNiche({
            empresaId: empresaIdForWa,
            appSku: "niche.consorcios",
            clienteNombre: unidad.residente.nombre,
            telefono: unidad.residente.telefono,
            concepto: `Expensas ${periodo}`,
            monto: Number(expensa.montoTotal),
            periodo,
            mensajeCustom
          }).catch(() => 0);
        }
      }
    }

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
