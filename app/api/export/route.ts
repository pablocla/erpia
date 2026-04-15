import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { exportService } from "@/lib/export/export-service"
import { z } from "zod"

/**
 * GET /api/export?entidad=clientes|productos|facturas|compras&desde=&hasta=
 */

const entidades = ["clientes", "productos", "facturas", "compras"] as const

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const params = request.nextUrl.searchParams
    const entidad = params.get("entidad") as (typeof entidades)[number]
    const desde = params.get("desde")
    const hasta = params.get("hasta")

    if (!entidad || !entidades.includes(entidad)) {
      return NextResponse.json(
        { error: `Entidad inválida. Opciones: ${entidades.join(", ")}` },
        { status: 400 },
      )
    }

    let result: { buffer: Buffer; filename: string; contentType: string }

    switch (entidad) {
      case "clientes":
        result = await exportService.exportarClientes(ctx.auth.empresaId)
        break
      case "productos":
        result = await exportService.exportarProductos(ctx.auth.empresaId)
        break
      case "facturas": {
        if (!desde || !hasta) {
          return NextResponse.json({ error: "Parámetros 'desde' y 'hasta' requeridos para facturas" }, { status: 400 })
        }
        result = await exportService.exportarFacturas(ctx.auth.empresaId, new Date(desde), new Date(hasta))
        break
      }
      case "compras": {
        if (!desde || !hasta) {
          return NextResponse.json({ error: "Parámetros 'desde' y 'hasta' requeridos para compras" }, { status: 400 })
        }
        result = await exportService.exportarCompras(ctx.auth.empresaId, new Date(desde), new Date(hasta))
        break
      }
    }

    return new NextResponse(result.buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar:", error)
    return NextResponse.json({ error: "Error al generar exportación" }, { status: 500 })
  }
}
