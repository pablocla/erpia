/**
 * GET /api/estadisticas/export — Export business data as CSV
 * Query params: tipo, fechaDesde, fechaHasta
 */
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { exportService } from "@/lib/export/export-service"

const TIPOS_VALIDOS = [
  "clientes", "productos", "facturas", "compras",
  "libro-iva-ventas", "libro-iva-compras",
  "cuentas-cobrar", "cuentas-pagar",
] as const

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") as typeof TIPOS_VALIDOS[number]
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Válidos: ${TIPOS_VALIDOS.join(", ")}` },
        { status: 400 },
      )
    }

    const needsDates = ["facturas", "compras", "libro-iva-ventas", "libro-iva-compras"].includes(tipo)
    if (needsDates && (!fechaDesde || !fechaHasta)) {
      return NextResponse.json({ error: "fechaDesde y fechaHasta requeridos" }, { status: 400 })
    }

    const desde = fechaDesde ? new Date(fechaDesde) : new Date()
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date()

    let result

    switch (tipo) {
      case "clientes":
        result = await exportService.exportarClientes(ctx.auth.empresaId)
        break
      case "productos":
        result = await exportService.exportarProductos(ctx.auth.empresaId)
        break
      case "facturas":
        result = await exportService.exportarFacturas(ctx.auth.empresaId, desde, hasta)
        break
      case "compras":
        result = await exportService.exportarCompras(ctx.auth.empresaId, desde, hasta)
        break
      case "libro-iva-ventas":
        result = await exportService.exportarLibroIVA(ctx.auth.empresaId, desde, hasta, "ventas")
        break
      case "libro-iva-compras":
        result = await exportService.exportarLibroIVA(ctx.auth.empresaId, desde, hasta, "compras")
        break
      case "cuentas-cobrar":
        result = await exportService.exportarCuentasCobrar(ctx.auth.empresaId)
        break
      case "cuentas-pagar":
        result = await exportService.exportarCuentasPagar(ctx.auth.empresaId)
        break
    }

    if (!result) {
      return NextResponse.json({ error: "Error al exportar" }, { status: 500 })
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error en exportación:", error)
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 })
  }
}
