import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { generarLiquidacionConsorcioPDF } from "@/lib/printer/pdf-consorcio-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const consorcioId = Number(id)
  const periodo = request.nextUrl.searchParams.get("periodo")

  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
    return NextResponse.json({ error: "Parámetro periodo requerido (YYYY-MM)" }, { status: 400 })
  }

  try {
    const result = await generarLiquidacionConsorcioPDF(
      auth.auth.empresaId,
      consorcioId,
      periodo,
    )
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${result.filename}"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al generar PDF"
    const status = msg.includes("no encontrado") ? 404 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}