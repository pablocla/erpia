/**
 * GET /api/impuestos/percepciones
 *
 * Aggregates IVA/IIBB perceptions emitted (from sales) and received (from purchases)
 * for a given period.
 *
 * Query params:
 *   mes   (required) — 1–12
 *   anio  (required) — YYYY
 *   tipo  (optional) — "emitidas" | "recibidas" | omit for both
 */
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const params = request.nextUrl.searchParams
    const mes = params.get("mes")
    const anio = params.get("anio")
    const tipo = params.get("tipo") // "emitidas" | "recibidas" | null

    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const mesNum  = Number.parseInt(mes, 10)
    const anioNum = Number.parseInt(anio, 10)

    if (Number.isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return NextResponse.json({ error: "mes inválido" }, { status: 400 })
    }
    if (Number.isNaN(anioNum) || anioNum < 2000) {
      return NextResponse.json({ error: "anio inválido" }, { status: 400 })
    }

    // Date range for the period
    const desde = new Date(anioNum, mesNum - 1, 1)
    const hasta = new Date(anioNum, mesNum, 1) // exclusive upper bound

    let percepciones_emitidas = null
    let percepciones_recibidas = null

    // Percepciones EMITIDAS — totalPercepciones on Facturas (ventas)
    if (!tipo || tipo === "emitidas") {
      const facturas = await prisma.factura.findMany({
        where: {
          createdAt: { gte: desde, lt: hasta },
          estado: { not: "anulada" },
          totalPercepciones: { gt: 0 },
        },
        select: {
          id: true,
          tipo: true,
          numero: true,
          puntoVenta: true,
          createdAt: true,
          totalPercepciones: true,
          cliente: { select: { nombre: true, cuit: true } },
        },
        orderBy: { createdAt: "asc" },
      })

      const totalEmitido = facturas.reduce((sum, f) => sum + f.totalPercepciones, 0)

      percepciones_emitidas = {
        total: Number(totalEmitido.toFixed(2)),
        cantidad: facturas.length,
        detalle: facturas,
      }
    }

    // Percepciones RECIBIDAS — totalPercepciones on Compras (purchases)
    if (!tipo || tipo === "recibidas") {
      const compras = await prisma.compra.findMany({
        where: {
          createdAt: { gte: desde, lt: hasta },
          totalPercepciones: { gt: 0 },
        },
        select: {
          id: true,
          tipo: true,
          numero: true,
          fecha: true,
          totalPercepciones: true,
          proveedor: { select: { nombre: true, cuit: true } },
        },
        orderBy: { fecha: "asc" },
      })

      const totalRecibido = compras.reduce((sum, c) => sum + c.totalPercepciones, 0)

      percepciones_recibidas = {
        total: Number(totalRecibido.toFixed(2)),
        cantidad: compras.length,
        detalle: compras,
      }
    }

    const saldo_neto =
      (percepciones_emitidas?.total ?? 0) - (percepciones_recibidas?.total ?? 0)

    return NextResponse.json({
      success: true,
      periodo: { mes: mesNum, anio: anioNum },
      percepciones_emitidas,
      percepciones_recibidas,
      saldo_neto: Number(saldo_neto.toFixed(2)),
    })
  } catch (error) {
    console.error("Error en GET /api/impuestos/percepciones:", error)
    return NextResponse.json({ error: "Error al obtener percepciones" }, { status: 500 })
  }
}
