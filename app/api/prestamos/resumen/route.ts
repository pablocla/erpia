import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getResumenPrestamos } from "@/lib/prestamos/prestamos-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const resumen = await getResumenPrestamos(ctx.auth.empresaId)
    return NextResponse.json(resumen)
  } catch (error) {
    console.error("Error al obtener resumen de préstamos:", error)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
