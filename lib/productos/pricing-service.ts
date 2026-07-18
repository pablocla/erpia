import { prisma } from "@/lib/prisma"

// Servicio auxiliar de precios para actualizar rápidamente productos con precio en USD.
// Se usa en combinación con el CRON diario, sin afectar la ruta clásica de edición individual.

export async function recalculateUsdPrices(tipoCambio: number) {
  const productosEnUsd = await prisma.producto.findMany({
    where: { monedaCosto: "USD", activo: true }
  })

  let actualizados = 0
  const margen = 1.30 // 30% default

  for (const p of productosEnUsd) {
    if (p.costoLandedUsd) {
      const nuevoPrecio = Number(p.costoLandedUsd) * tipoCambio * margen
      await prisma.producto.update({
        where: { id: p.id },
        data: { precioVenta: nuevoPrecio }
      })
      actualizados++
    }
  }

  return { ok: true, actualizados }
}
