import { prisma } from "@/lib/prisma"
import { getParametro } from "@/lib/config/parametro-service"
import { ARBACOTClient, type ARBACOTResponse } from "@/lib/afip/arba-cot-client"

export class COTService {
  /**
   * Procesa y tramita el COT (Código de Operación de Transporte) para un remito dado.
   * Valida si supera los límites de peso o valor y si el destino es la Provincia de Buenos Aires.
   */
  async procesarCOT(remitoId: number): Promise<{ success: boolean; cotId?: number; numeroCOT?: string; error?: string }> {
    try {
      // 1. Obtener remito con relaciones necesarias
      const remito = await prisma.remito.findUnique({
        where: { id: remitoId },
        include: {
          empresa: true,
          cliente: {
            include: {
              provincia: true,
            },
          },
          factura: true,
          pedidoVenta: true,
          lineas: {
            include: {
              producto: true,
            },
          },
        },
      })

      if (!remito) {
        return { success: false, error: "Remito no encontrado" }
      }

      const empresaId = remito.empresaId
      const client = remito.cliente

      // 2. Determinar si el destino es Provincia de Buenos Aires (PBA)
      // Buscamos si la provincia del cliente contiene "buenos aires", "pba" o si el domicilio de entrega lo explicita.
      const provinciaNombre = client.provincia?.nombre?.toLowerCase() ?? ""
      const direccionCompleta = (remito.observaciones ?? "").toLowerCase() + " " + (client.direccion ?? "").toLowerCase()
      
      const esDestinoPBA = 
        provinciaNombre.includes("buenos aires") || 
        provinciaNombre.includes("pba") ||
        provinciaNombre.includes("baires") ||
        provinciaNombre.includes("bs as") ||
        direccionCompleta.includes("buenos aires") ||
        direccionCompleta.includes("provincia de bs")

      if (!esDestinoPBA) {
        return { success: false, error: "El destino del remito no es en la Provincia de Buenos Aires. No requiere COT." }
      }

      // 3. Cargar parámetros fiscales con fallbacks
      const arbaCotPesoMinimo = await getParametro(empresaId, "arba_cot_peso_minimo", 4500, "AR")
      const arbaCotValorMinimo = await getParametro(empresaId, "arba_cot_valor_minimo", 45000, "AR")

      // 4. Calcular el peso total del remito
      let pesoTotal = 0
      let cantidadUnidades = 0
      for (const linea of remito.lineas) {
        const pesoProd = linea.producto?.peso ?? 0
        const unidad = (linea.producto?.pesoUnidad ?? "kg").toLowerCase()
        
        let pesoEnKg = pesoProd
        if (unidad === "g" || unidad === "gramos") {
          pesoEnKg = pesoProd / 1000
        } else if (unidad === "tn" || unidad === "tonelada" || unidad === "toneladas") {
          pesoEnKg = pesoProd * 1000
        }

        pesoTotal += linea.cantidad * pesoEnKg
        cantidadUnidades += Math.ceil(linea.cantidad)
      }

      // 5. Calcular valor nominal de la mercadería
      // Prioridad: Factura asociada > Pedido de Venta asociado > Suma de precio base de productos
      let valorMercaderia = 0
      if (remito.factura) {
        valorMercaderia = Number(remito.factura.total)
      } else if (remito.pedidoVenta) {
        valorMercaderia = Number(remito.pedidoVenta.total)
      } else {
        for (const linea of remito.lineas) {
          const precioBase = Number(linea.producto?.precioBase ?? 0)
          valorMercaderia += linea.cantidad * precioBase
        }
      }

      // 6. Verificar si califica para COT (si supera uno de los dos límites)
      const superaPeso = pesoTotal >= arbaCotPesoMinimo
      const superaValor = valorMercaderia >= arbaCotValorMinimo

      if (!superaPeso && !superaValor) {
        return {
          success: false,
          error: `No supera los umbrales requeridos para COT ARBA (Peso: ${pesoTotal.toFixed(1)}kg / Mín: ${arbaCotPesoMinimo}kg; Valor: $${valorMercaderia.toFixed(2)} / Mín: $${arbaCotValorMinimo}).`,
        }
      }

      // 7. Invocar cliente SOAP de ARBA (simulado)
      const environment = "homologacion" // O dinámico según config de la empresa
      const clientSOAP = new ARBACOTClient(environment)

      const cotResponse: ARBACOTResponse = await clientSOAP.solicitarCOT({
        cuitEmisor: remito.empresa.cuit,
        cuitReceptor: client.cuit ?? "00-00000000-0",
        domicilioEntrega: client.direccion ?? "Domicilio No Especificado",
        localidadEntrega: client.localidadId ? String(client.localidadId) : "Localidad No Especificada",
        valorMercaderia,
        pesoTotal,
        cantidadUnidades,
      })

      // 8. Registrar / Guardar en base de datos
      const db = prisma as any
      if (cotResponse.success && cotResponse.numeroCOT) {
        const cotRecord = await db.cOT.upsert({
          where: { remitoId },
          update: {
            numeroCOT: cotResponse.numeroCOT,
            codigoIntegridad: cotResponse.codigoIntegridad ?? null,
            estado: "aprobado",
            cuitEmisor: remito.empresa.cuit,
            cuitReceptor: client.cuit ?? null,
            domicilioEntrega: client.direccion ?? "Domicilio No Especificado",
            localidadEntrega: client.localidadId ? String(client.localidadId) : "Localidad No Especificada",
            valorMercaderia,
            pesoTotal,
            cantidadUnidades,
            respuestaARBA: cotResponse.respuestaARBA ?? null,
            fechaVencimiento: cotResponse.fechaVencimiento ?? null,
            errorMensaje: null,
          },
          create: {
            remitoId,
            numeroCOT: cotResponse.numeroCOT,
            codigoIntegridad: cotResponse.codigoIntegridad ?? null,
            estado: "aprobado",
            cuitEmisor: remito.empresa.cuit,
            cuitReceptor: client.cuit ?? null,
            domicilioEntrega: client.direccion ?? "Domicilio No Especificado",
            localidadEntrega: client.localidadId ? String(client.localidadId) : "Localidad No Especificada",
            valorMercaderia,
            pesoTotal,
            cantidadUnidades,
            respuestaARBA: cotResponse.respuestaARBA ?? null,
            fechaVencimiento: cotResponse.fechaVencimiento ?? null,
          },
        })

        // Cambiar el estado del remito a entregado/procesado si se desea, o asociar el número
        await prisma.remito.update({
          where: { id: remitoId },
          data: { observaciones: `${remito.observaciones ?? ""}\n[COT ARBA: ${cotResponse.numeroCOT}]`.trim() },
        })

        return {
          success: true,
          cotId: cotRecord.id,
          numeroCOT: cotResponse.numeroCOT,
        }
      } else {
        // Guardar registro de error
        await db.cOT.upsert({
          where: { remitoId },
          update: {
            estado: "rechazado",
            cuitEmisor: remito.empresa.cuit,
            cuitReceptor: client.cuit ?? null,
            domicilioEntrega: client.direccion ?? "Domicilio No Especificado",
            localidadEntrega: client.localidadId ? String(client.localidadId) : "Localidad No Especificada",
            valorMercaderia,
            pesoTotal,
            cantidadUnidades,
            errorMensaje: cotResponse.errorMensaje ?? "Error desconocido en ARBA",
            respuestaARBA: cotResponse.respuestaARBA ?? null,
          },
          create: {
            remitoId,
            estado: "rechazado",
            cuitEmisor: remito.empresa.cuit,
            cuitReceptor: client.cuit ?? null,
            domicilioEntrega: client.direccion ?? "Domicilio No Especificado",
            localidadEntrega: client.localidadId ? String(client.localidadId) : "Localidad No Especificada",
            valorMercaderia,
            pesoTotal,
            cantidadUnidades,
            errorMensaje: cotResponse.errorMensaje ?? "Error desconocido en ARBA",
            respuestaARBA: cotResponse.respuestaARBA ?? null,
          },
        })

        return {
          success: false,
          error: cotResponse.errorMensaje ?? "ARBA rechazó la solicitud de COT.",
        }
      }
    } catch (e) {
      console.error("[COTService] Error:", e)
      return { success: false, error: e instanceof Error ? e.message : "Error al procesar el COT" }
    }
  }
}

export const cotService = new COTService()
