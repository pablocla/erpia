import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { encolarWhatsAppNiche } from "@/lib/niche/niche-whatsapp"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verificación simple de token para crons (Vercel Cron)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hoy = new Date()
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
  
  // Buscar contratos activos que no hayan sido facturados este mes
  const contratos = await prisma.contratoAlquiler.findMany({
    where: {
      estado: "activo",
      OR: [
        { ultimoPeriodoFacturado: { not: periodoActual } },
        { ultimoPeriodoFacturado: null }
      ]
    },
    include: {
      propiedad: true,
      inquilino: true
    }
  })

  let generados = 0
  for (const contrato of contratos) {
    try {
      // 1. Generar la Factura B / Recibo interno
      const fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), contrato.diaVencimiento)
      
      const factura = await prisma.factura.create({
        data: {
          empresaId: contrato.empresaId,
          clienteId: contrato.inquilinoId,
          tipo: "B",
          tipoCbte: 6,
          numero: 0,
          puntoVenta: 1, // asumiendo PV default
          subtotal: contrato.montoMensual,
          iva: 0,
          total: contrato.montoMensual,
          concepto: 2, // Servicios
          estado: "interna", // No la enviamos a AFIP automáticamente
          fechaVtoPago: fechaVencimiento,
          observaciones: `Alquiler ${periodoActual} - ${contrato.propiedad.direccion}`,
          lineas: {
            create: [
              {
                descripcion: `Alquiler Período ${periodoActual} - ${contrato.propiedad.direccion}`,
                cantidad: 1,
                precioUnitario: contrato.montoMensual,
                porcentajeIva: 0,
                codigoAfipIva: "3",
                subtotal: contrato.montoMensual,
                iva: 0,
                total: contrato.montoMensual,
              },
            ],
          },
        },
      })

      // 2. Generar Cuenta por Cobrar
      await prisma.cuentaCobrar.create({
        data: {
          facturaId: factura.id,
          clienteId: contrato.inquilinoId,
          numeroCuota: 1,
          montoOriginal: contrato.montoMensual,
          saldo: contrato.montoMensual,
          fechaEmision: hoy,
          fechaVencimiento,
          estado: "pendiente",
          observaciones: `Alquiler ${periodoActual} - ${contrato.propiedad.direccion}`,
        },
      })

      // 3. Actualizar contrato y saldo del inquilino
      await prisma.contratoAlquiler.update({
        where: { id: contrato.id },
        data: { ultimoPeriodoFacturado: periodoActual }
      })

      await prisma.cliente.update({
        where: { id: contrato.inquilinoId },
        data: { saldoCuentaCorriente: { increment: contrato.montoMensual } }
      })

      // 4. Enviar aviso por WhatsApp
      if (contrato.inquilino.telefono) {
        const mensajeCustom = `Hola ${contrato.inquilino.nombre}, ya se generó el cobro de tu alquiler correspondiente a ${periodoActual} por la propiedad en ${contrato.propiedad.direccion}. Monto a abonar: $${Number(contrato.montoMensual).toLocaleString('es-AR')}. Vence el día ${contrato.diaVencimiento}. Podés pagar ingresando a tu panel de inquilino.`;
        await encolarWhatsAppNiche({
          empresaId: contrato.empresaId,
          appSku: "niche.inmobiliaria",
          clienteNombre: contrato.inquilino.nombre,
          telefono: contrato.inquilino.telefono,
          concepto: `Alquiler ${periodoActual}`,
          monto: Number(contrato.montoMensual),
          periodo: periodoActual,
          mensajeCustom
        }).catch(() => 0)
      }

      generados++
    } catch (error) {
      await persistSistemaLog({
        empresaId: contrato.empresaId,
        categoria: "error",
        contexto: "cron_alquiler",
        mensaje: `Fallo al generar alquiler para contrato ${contrato.id}`,
        severidad: "error",
        metadata: { error: String(error) }
      }).catch(() => 0)
    }
  }

  return NextResponse.json({ success: true, generados, procesados: contratos.length, periodo: periodoActual })
}
