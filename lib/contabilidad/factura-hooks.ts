import { prisma } from "@/lib/prisma"
import { AsientoService } from "./asiento-service"

async function logContabilidadError(handler: string, evento: string, id: number, error: unknown) {
  const errorMsg = error instanceof Error ? error.message : String(error)
  console.error(`[CONTABILIDAD ERROR] en hook ${handler} para id=${id}:`, errorMsg)
  try {
    await prisma.handlerLog.create({
      data: {
        evento,
        handler,
        exito: false,
        payload: JSON.stringify({ id }),
        errorMsg,
      },
    })
  } catch {
    // Si falla la auditoría en base de datos, evitar interrumpir el flujo principal
  }
}

export async function onFacturaEmitida(facturaId: number, empresaId?: number): Promise<void> {
  try {
    const asientoService = new AsientoService()
    await asientoService.generarAsientoVenta(facturaId, empresaId)
  } catch (error) {
    await logContabilidadError("asiento_venta", "FACTURA_EMITIDA", facturaId, error)
  }
}

export async function onCompraRegistrada(compraId: number): Promise<void> {
  try {
    const asientoService = new AsientoService()
    await asientoService.generarAsientoCompra(compraId)
  } catch (error) {
    await logContabilidadError("asiento_compra", "COMPRA_REGISTRADA", compraId, error)
  }
}

export async function registrarAsientoCompra(compra: any, tx?: any): Promise<void> {
  try {
    const asientoService = new AsientoService()
    await asientoService.generarAsientoCompra(compra.id, compra.empresaId, tx)
  } catch (error) {
    console.error("Error al registrar asiento de compra:", error)
    throw error
  }
}

export async function onNCEmitida(ncId: number): Promise<void> {
  try {
    const asientoService = new AsientoService()
    await asientoService.generarAsientoNC(ncId)
  } catch (error) {
    await logContabilidadError("asiento_nc", "NC_EMITIDA", ncId, error)
  }
}
