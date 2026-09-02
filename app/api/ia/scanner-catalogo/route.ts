import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { parsearListaOFacturaConIA, importarProductosEscaneados } from "@/lib/ia/catalogo-scanner-service"
import { z } from "zod"

const ParseSchema = z.object({
  texto: z.string().min(5, "Texto muy corto para analizar"),
  margen: z.number().min(0).max(500).optional().default(40),
  rubro: z.string().optional().default("kiosco"),
  importarDirecto: z.boolean().optional().default(false),
})

const ImportSchema = z.object({
  productos: z.array(
    z.object({
      codigo: z.string().optional(),
      nombre: z.string().min(1),
      categoria: z.string().optional(),
      costo: z.number(),
      precioSugerido: z.number(),
      margenPorcentaje: z.number(),
      stockInicial: z.number().default(0),
      unidad: z.string().optional(),
      iva: z.number().default(21),
    })
  ),
})

/**
 * POST /api/ia/scanner-catalogo
 * Procesa texto de factura/lista de precios con IA y opcionalmente importa al inventario.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    // Caso 1: Importar productos ya validados
    if (body.action === "importar") {
      const parsed = ImportSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: "Datos de productos inválidos", detalles: parsed.error.errors }, { status: 400 })
      }
      const resultado = await importarProductosEscaneados(auth.auth.empresaId, parsed.data.productos)
      return NextResponse.json({ ok: true, ...resultado })
    }

    // Caso 2: Parsear texto con IA
    const parsed = ParseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Entrada inválida", detalles: parsed.error.errors }, { status: 400 })
    }

    const { texto, margen, rubro, importarDirecto } = parsed.data
    const resultado = await parsearListaOFacturaConIA(texto, margen, rubro)

    if (importarDirecto && resultado.productos.length > 0) {
      const imp = await importarProductosEscaneados(auth.auth.empresaId, resultado.productos)
      return NextResponse.json({ ok: true, scanner: resultado, importacion: imp })
    }

    return NextResponse.json({ ok: true, ...resultado })
  } catch (err) {
    console.error("[api/ia/scanner-catalogo] Error:", err)
    return NextResponse.json({ error: "Error procesando el escaneo" }, { status: 500 })
  }
}
