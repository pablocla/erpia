import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { assertContadorPuedeLeer } from "@/lib/contador/multi-empresa-service"
import { packContadorService } from "@/lib/impuestos/pack-contador-service"
import { IVAService } from "@/lib/impuestos/iva-service"
import { generarCITIVentas, generarCITICompras } from "@/lib/impuestos/citi-service"
import JSZip from "jszip"

/**
 * GET /api/contador/clientes/[empresaId]/export-iva?mes=7&anio=2026&formato=pack|citi
 * Exporta Libro IVA Digital / pack contador del cliente (solo lectura fiscal).
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ empresaId: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { empresaId: raw } = await ctx.params
  const clienteEmpresaId = Number(raw)
  if (!clienteEmpresaId) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  const access = await assertContadorPuedeLeer(auth.auth.empresaId, clienteEmpresaId)
  if (!access.ok) {
    return NextResponse.json({ error: "Sin acceso a esta empresa" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const mes = Number(searchParams.get("mes") ?? now.getMonth() + 1)
  const anio = Number(searchParams.get("anio") ?? now.getFullYear())
  const formato = (searchParams.get("formato") ?? "pack").toLowerCase()

  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(anio) || anio < 2000) {
    return NextResponse.json({ error: "mes (1-12) y anio válidos requeridos" }, { status: 400 })
  }

  try {
    if (formato === "citi") {
      const periodo = `${anio}-${String(mes).padStart(2, "0")}`
      const [ventas, compras] = await Promise.all([
        generarCITIVentas(clienteEmpresaId, periodo),
        generarCITICompras(clienteEmpresaId, periodo),
      ])

      const zip = new JSZip()
      zip.file(ventas.nombreArchivo, ventas.contenido)
      zip.file(compras.nombreArchivo, compras.contenido)
      zip.file(
        "README.txt",
        [
          "LIBRO IVA DIGITAL — CITI (AFIP/ARCA)",
          `Período: ${periodo}`,
          `Cliente empresaId: ${clienteEmpresaId}`,
          `Generado: ${new Date().toLocaleString("es-AR")}`,
          "",
          "Importá estos TXT en SIAP / Mis Comprobaciones.",
        ].join("\r\n"),
      )

      const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
      const filename = `citi_iva_${clienteEmpresaId}_${periodo}.zip`

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    if (formato === "csv") {
      const iva = new IVAService()
      const [ventasCsv, comprasCsv] = await Promise.all([
        iva.exportarLibroIVAVentasCSV(mes, anio, clienteEmpresaId),
        iva.exportarLibroIVAComprasCSV(mes, anio, clienteEmpresaId),
      ])
      const zip = new JSZip()
      zip.file(`libro_iva_ventas_${anio}-${String(mes).padStart(2, "0")}.csv`, ventasCsv)
      zip.file(`libro_iva_compras_${anio}-${String(mes).padStart(2, "0")}.csv`, comprasCsv)
      const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="libro_iva_${clienteEmpresaId}_${anio}-${String(mes).padStart(2, "0")}.zip"`,
        },
      })
    }

    // Pack completo contador (ZIP con libros + SICORE + checklist)
    const { buffer, meta, filename } = await packContadorService.generarPack(
      clienteEmpresaId,
      mes,
      anio,
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Pack-Periodo": meta.periodo,
        "X-Cliente-Empresa-Id": String(clienteEmpresaId),
        "X-Permisos": access.permisos,
      },
    })
  } catch (err) {
    console.error("[contador/export-iva]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al exportar" },
      { status: 500 },
    )
  }
}
