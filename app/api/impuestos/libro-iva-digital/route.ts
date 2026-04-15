import { type NextRequest, NextResponse } from "next/server"
import { IVAService } from "@/lib/impuestos/iva-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

/**
 * GET /api/impuestos/libro-iva-digital?mes=1&anio=2025&tipo=ventas|compras|alicuotas
 *
 * Generates RG 4597/2019 Libro IVA Digital files importable to AFIP Portal IVA.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const searchParams = request.nextUrl.searchParams
    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const tipo = searchParams.get("tipo") ?? "ventas"

    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const ivaService = new IVAService()
    const m = Number.parseInt(mes)
    const a = Number.parseInt(anio)

    let contenido: string
    let filename: string

    switch (tipo) {
      case "ventas":
        contenido = await ivaService.generarLibroIVADigitalVentas(m, a, ctx.auth.empresaId)
        filename = `LIBRO_IVA_DIGITAL_VENTAS_CBTE_${mes.padStart(2, "0")}${anio}.txt`
        break
      case "compras":
        contenido = await ivaService.generarLibroIVADigitalCompras(m, a, ctx.auth.empresaId)
        filename = `LIBRO_IVA_DIGITAL_COMPRAS_CBTE_${mes.padStart(2, "0")}${anio}.txt`
        break
      case "alicuotas":
        contenido = await ivaService.generarLibroIVADigitalAlicuotasVentas(m, a, ctx.auth.empresaId)
        filename = `LIBRO_IVA_DIGITAL_VENTAS_ALIC_${mes.padStart(2, "0")}${anio}.txt`
        break
      default:
        return NextResponse.json({ error: "tipo debe ser ventas, compras o alicuotas" }, { status: 400 })
    }

    return new NextResponse(contenido, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error al generar Libro IVA Digital:", error)
    return NextResponse.json({ error: "Error al generar Libro IVA Digital" }, { status: 500 })
  }
}
