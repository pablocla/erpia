import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { comisionesService } from "@/lib/ventas/comisiones-service"

// ─── GET — Liquidar comisiones por período ──────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const vendedorId = searchParams.get("vendedorId")

    if (!desde || !hasta) {
      return NextResponse.json({ error: "Parámetros 'desde' y 'hasta' requeridos (YYYY-MM-DD)" }, { status: 400 })
    }

    const fechaDesde = new Date(desde)
    const fechaHasta = new Date(hasta + "T23:59:59.999Z")

    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
      return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 })
    }

    if (vendedorId) {
      const resultado = await comisionesService.comisionVendedor(
        parseInt(vendedorId, 10),
        ctx.auth.empresaId,
        fechaDesde,
        fechaHasta,
      )
      if (!resultado) {
        return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: resultado })
    }

    const resultado = await comisionesService.liquidarPeriodo(
      ctx.auth.empresaId,
      fechaDesde,
      fechaHasta,
    )

    return NextResponse.json({ success: true, data: resultado })
  } catch (error) {
    console.error("Error al liquidar comisiones:", error)
    return NextResponse.json({ error: "Error al liquidar comisiones" }, { status: 500 })
  }
}
