import { prisma } from "@/lib/prisma"

export async function calcularLandedCost(despachoId: number) {
  // 1. Obtener la carpeta de importación
  const despacho = await prisma.despachoImportacion.findUnique({
    where: { id: despachoId },
    include: {
      lineasCompra: {
        include: { producto: true }
      }
    }
  })

  if (!despacho) throw new Error("Despacho no encontrado")

  // 2. Sumar todos los gastos extra al Flete + Seguro (Costo Total de Aduana en USD)
  // Nota: En la vida real, se convierte gastosExtraArs a USD usando el tipoCambio del día del despacho
  const tipoCambioAduanero = 1000 // Mock
  const flete = Number(despacho.fleteUsd)
  const seguro = Number(despacho.seguroUsd)
  const gastosExtraUsd = (Number(despacho.gastosExtraArs) + Number(despacho.arancelesArs)) / tipoCambioAduanero

  const totalGastosUsd = flete + seguro + gastosExtraUsd

  // 3. Sumar el FOB Total
  const totalFob = Number(despacho.valorFobTotal)
  if (totalFob <= 0) return { ok: false, error: "Valor FOB inválido" }

  // 4. Prorratear los gastos sobre cada producto usando el método "Porcentaje del valor FOB"
  let lineasActualizadas = 0
  for (const linea of despacho.lineasCompra) {
    if (linea.productoId) {
      const lineaFobUsd = Number(linea.precioUnitario) // Asumimos precio compra = FOB
      const pesoRelativo = lineaFobUsd / totalFob // Ej: si la linea es 20% del contenedor
      
      const gastoProrrateadoLinea = pesoRelativo * totalGastosUsd
      const nuevoCostoLandedUsd = lineaFobUsd + gastoProrrateadoLinea

      // 5. Actualizar producto maestro
      await prisma.producto.update({
        where: { id: linea.productoId },
        data: {
          costoFobUsd: lineaFobUsd,
          costoLandedUsd: nuevoCostoLandedUsd,
          monedaCosto: "USD"
        }
      })
      lineasActualizadas++
    }
  }

  return { ok: true, lineasActualizadas, totalGastosUsd }
}
