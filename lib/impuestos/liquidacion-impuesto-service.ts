import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export class LiquidacionImpuestoService {
  /**
   * Persiste una nueva liquidación de impuestos (IVA, IIBB, SICORE).
   * Genera un hash para garantizar inmutabilidad.
   */
  async guardarLiquidacion(
    empresaId: number,
    tipo: "iva" | "iibb" | "sicore",
    periodo: string, // YYYY-MM
    totales: any
  ) {
    // Verificar si ya existe
    const existe = await prisma.liquidacionImpuesto.findFirst({
      where: { empresaId, tipo, periodo }
    })

    if (existe) {
      throw new Error(`Ya existe una liquidación de ${tipo.toUpperCase()} para el período ${periodo}.`)
    }

    const jsonString = JSON.stringify(totales)
    const hash = crypto.createHash("sha256").update(`${empresaId}-${tipo}-${periodo}-${jsonString}`).digest("hex")

    return await prisma.liquidacionImpuesto.create({
      data: {
        empresaId,
        tipo,
        periodo,
        totales,
        hash
      }
    })
  }

  /**
   * Obtiene las liquidaciones de un período.
   */
  async obtenerLiquidaciones(empresaId: number, periodo?: string) {
    return await prisma.liquidacionImpuesto.findMany({
      where: {
        empresaId,
        ...(periodo ? { periodo } : {})
      },
      orderBy: { fechaGeneracion: "desc" }
    })
  }
}
