import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { pdfService } from "@/lib/printer/pdf-service"
import { z } from "zod"

const schema = z.object({
  tipo: z.enum(["factura", "nc", "nd", "remito", "presupuesto", "oc", "remito-transferencia", "remito-entrada"]),
  id: z.number().int().positive(),
})

// ─── GET — Generar comprobante PDF/HTML por tipo+id ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") ?? ""
    const id = parseInt(searchParams.get("id") ?? "0", 10)

    const parsed = schema.safeParse({ tipo, id })
    if (!parsed.success) {
      return NextResponse.json({ error: "Parámetros inválidos (tipo: factura|nc|nd|remito|presupuesto|oc|remito-transferencia|remito-entrada, id: número)" }, { status: 400 })
    }

    let result
    switch (parsed.data.tipo) {
      case "factura":
        result = await pdfService.generarFacturaPDF({ facturaId: parsed.data.id })
        break
      case "nc":
        result = await pdfService.generarNCPDF(parsed.data.id)
        break
      case "nd":
        result = await pdfService.generarNDPDF(parsed.data.id)
        break
      case "remito":
        result = await pdfService.generarRemitoPDF(parsed.data.id)
        break
      case "presupuesto":
        result = await pdfService.generarPresupuestoPDF(parsed.data.id)
        break
      case "oc":
        result = await pdfService.generarOCPDF(parsed.data.id)
        break
      case "remito-transferencia":
        result = await pdfService.generarRemitoTransferenciaPDF(parsed.data.id)
        break
      case "remito-entrada":
        result = await pdfService.generarRemitoEntradaPDF(parsed.data.id)
        break
    }

    if (!result) {
      return NextResponse.json({ error: "Tipo de comprobante no soportado" }, { status: 400 })
    }

    // Return as downloadable HTML (browser's print/save as PDF)
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${result.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generando PDF:", error)
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── POST — Generar y retornar metadata + HTML en JSON ──────────────────────

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    let result
    switch (parsed.data.tipo) {
      case "factura":
        result = await pdfService.generarFacturaPDF({ facturaId: parsed.data.id })
        break
      case "nc":
        result = await pdfService.generarNCPDF(parsed.data.id)
        break
      case "nd":
        result = await pdfService.generarNDPDF(parsed.data.id)
        break
      case "remito":
        result = await pdfService.generarRemitoPDF(parsed.data.id)
        break
      case "presupuesto":
        result = await pdfService.generarPresupuestoPDF(parsed.data.id)
        break
      case "oc":
        result = await pdfService.generarOCPDF(parsed.data.id)
        break
      case "remito-transferencia":
        result = await pdfService.generarRemitoTransferenciaPDF(parsed.data.id)
        break
      case "remito-entrada":
        result = await pdfService.generarRemitoEntradaPDF(parsed.data.id)
        break
    }

    if (!result) {
      return NextResponse.json({ error: "Tipo no soportado" }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      html: result.html,
      filename: result.filename,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error("Error generando PDF:", error)
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
