/**
 * /api/config/asientos — CRUD mapeo de cuentas contables para asientos automáticos
 *
 * GET  ?empresaId=1                        → lista todos
 * GET  ?empresaId=1&tipoTransaccion=venta  → filtrar
 * PUT  { id, cuentaCodigo, cuentaNombre? } → actualizar mapeo
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { invalidateConfigCache } from "@/lib/config/parametro-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = Number(searchParams.get("empresaId") || "1")
    const tipoTransaccion = searchParams.get("tipoTransaccion")

    const config = await prisma.configAsientoCuenta.findMany({
      where: {
        empresaId,
        activo: true,
        ...(tipoTransaccion ? { tipoTransaccion } : {}),
      },
      orderBy: [{ tipoTransaccion: "asc" }, { campo: "asc" }],
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error al obtener config asientos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, cuentaCodigo, cuentaNombre } = body

    if (!id || !cuentaCodigo) {
      return NextResponse.json({ error: "id y cuentaCodigo requeridos" }, { status: 400 })
    }

    const config = await prisma.configAsientoCuenta.update({
      where: { id },
      data: {
        cuentaCodigo,
        ...(cuentaNombre !== undefined ? { cuentaNombre } : {}),
      },
    })

    invalidateConfigCache()
    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error al actualizar config asientos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
