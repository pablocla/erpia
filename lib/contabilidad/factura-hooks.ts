import { AsientoService } from "./asiento-service"

export async function onFacturaEmitida(facturaId: number, empresaId?: number): Promise<void> {
  try {
    const asientoService = new AsientoService()
    await asientoService.generarAsientoVenta(facturaId, empresaId)
  } catch (error) {
    console.error("Error en hook onFacturaEmitida:", error)
    // No lanzar el error para no interrumpir el flujo de facturación
  }
}

export async function onCompraRegistrada(compraId: number): Promise<void> {
  try {
    const asientoService = new AsientoService()
    await asientoService.generarAsientoCompra(compraId)
  } catch (error) {
    console.error("Error en hook onCompraRegistrada:", error)
  }
}

export async function registrarAsientoCompra(compra: any): Promise<void> {
  try {
    const asientoService = new AsientoService()
    await asientoService.generarAsientoCompra(compra.id)
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
    console.error("Error en hook onNCEmitida:", error)
    // No lanzar para no interrumpir el flujo de emisión de NC
  }
}
