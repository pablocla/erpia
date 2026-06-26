import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { alertarStockCeroDiario } from "@/lib/almacen-rosario/stock-cero-service"
import { listarOfertasZeroWasteHoy } from "@/lib/almacen-rosario/zero-waste-service"
import { crearAlertaIAConNotificacion } from "@/lib/ai/notificacion-ia-service"

const SKUS = ["pos.stock_cero_alert", "pos.zero_waste", "pos.margen_guard"] as const

/**
 * GET /api/cron/almacen-rosario — reportes diarios pack almacén.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const resultados: Array<{ empresaId: number; alertas: number; error?: string }> = []

  try {
    const empresas = await prisma.empresa.findMany({
      where: {
        deletedAt: null,
        suscripciones: {
          some: { sku: { in: [...SKUS] }, activo: true },
        },
      },
      select: { id: true },
    })

    for (const empresa of empresas) {
      const r = { empresaId: empresa.id, alertas: 0 }
      try {
        const subs = await prisma.suscripcionModulo.findMany({
          where: { empresaId: empresa.id, activo: true, sku: { in: [...SKUS] } },
          select: { sku: true },
        })
        const skus = new Set(subs.map((s) => s.sku))

        if (skus.has("pos.stock_cero_alert")) {
          const rep = await alertarStockCeroDiario(empresa.id)
          if (rep) r.alertas++
        }

        if (skus.has("pos.zero_waste")) {
          const ofertas = await listarOfertasZeroWasteHoy(empresa.id, 5)
          if (ofertas.length > 0) {
            await crearAlertaIAConNotificacion({
              empresaId: empresa.id,
              tipo: "zero_waste",
              prioridad: "media",
              titulo: `${ofertas.length} productos a rematar hoy`,
              descripcion: ofertas.map((o) => `${o.nombre} -${o.descuentoPct}%`).join(" · "),
              accion: "Publicar ofertas en WhatsApp del local",
              origen: "cron",
              agenteId: "zero-waste",
            })
            r.alertas++
          }
        }

        if (skus.has("pos.margen_guard")) {
          const negativos = await prisma.producto.findMany({
            where: { empresaId: empresa.id, activo: true, deletedAt: null, precioCompra: { gt: 0 } },
            select: { nombre: true, precioCompra: true, precioVenta: true },
          })
          const mal = negativos.filter((p) => Number(p.precioVenta) < Number(p.precioCompra))
          if (mal.length >= 3) {
            await crearAlertaIAConNotificacion({
              empresaId: empresa.id,
              tipo: "margen_negativo",
              prioridad: "alta",
              titulo: `${mal.length} productos con margen negativo`,
              descripcion: mal.slice(0, 5).map((p) => p.nombre).join(" · "),
              accion: "Importá lista de distribuidora o actualizá precios",
              origen: "cron",
              agenteId: "margen-guard",
            })
            r.alertas++
          }
        }
      } catch (err) {
        r.error = (err as Error).message
      }
      resultados.push(r)
    }

    return NextResponse.json({ success: true, empresas: resultados.length, resultados })
  } catch (error) {
    console.error("[Cron Almacén Rosario]", error)
    return NextResponse.json({ error: "Error cron almacén" }, { status: 500 })
  }
}