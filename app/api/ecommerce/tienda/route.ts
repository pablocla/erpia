import { type NextRequest, NextResponse } from "next/server"
import { getTiendaConfigByEmpresaId } from "@/lib/ecommerce/store-config-service"
import { logError } from "@/lib/monitoring/error-logger"

/** Config pública de tienda por empresaId (compat /tienda?empresaId=) */
export async function GET(request: NextRequest) {
  try {
    const empresaIdRaw = request.nextUrl.searchParams.get("empresaId")
    const empresaId = empresaIdRaw ? Number(empresaIdRaw) : Number.NaN
    if (!empresaIdRaw || Number.isNaN(empresaId)) {
      return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })
    }

    const config = await getTiendaConfigByEmpresaId(empresaId)
    if (!config) {
      return NextResponse.json({
        empresaId,
        configurada: false,
        mediosPago: { mercadopago: true, transferencia: true, confirmarSinPago: true },
      })
    }

    return NextResponse.json({ configurada: true, ...config })
  } catch (error) {
    logError("api/ecommerce/tienda:GET", error, request)
    return NextResponse.json({ error: "Error al cargar tienda" }, { status: 500 })
  }
}