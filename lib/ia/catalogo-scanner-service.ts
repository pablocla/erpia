/**
 * Servicio de IA: Escaneo y parsing de Facturas de Proveedores / Listas de Precios
 * Convierte texto no estructurado, fotos de góndolas o PDFs de distribuidores en catálogo listo para importar.
 */

import { aiService } from "@/lib/ai/ai-service"
import { prisma } from "@/lib/prisma"

export interface ProductoEscaneado {
  codigo?: string
  nombre: string
  categoria?: string
  costo: number
  precioSugerido: number
  margenPorcentaje: number
  stockInicial: number
  unidad?: string
  iva: number
}

export interface ScannerResultado {
  proveedorDetectado?: string
  totalProductos: number
  productos: ProductoEscaneado[]
  sugerenciasIa: string[]
}

const SYSTEM_PROMPT_CATALOGO = `Sos un asistente experto en comercios de Argentina (kioscos, ferreterías, almacenes, verdulerías, talleres).
Tu tarea es recibir texto extraído de una factura de compra a proveedor, lista de precios o inventario informal, y estructurarlo en productos de catálogo con precios en pesos argentinos (ARS).

Reglas:
1. Normalizá los nombres de los productos (ej: "COCA RET 2.25" → "Coca Cola Retornable 2.25L").
2. Identificá el costo unitario sin IVA o con IVA según el texto.
3. Si no hay precio de venta sugerido, calculá un margen estándar del 35% al 50% según el rubro (ej: golosinas 45%, bebidas 35%, cigarrillos 8%).
4. Asigná categorías claras: Bebidas, Almacén, Limpieza, Golosinas, Ferretería, etc.
5. Devolvé SIEMPRE un JSON válido con la estructura solicitada. No agregues texto fuera del JSON.`

export async function parsearListaOFacturaConIA(
  textoOcr: string,
  margenDefecto = 40,
  rubro = "kiosco"
): Promise<ScannerResultado> {
  const prompt = `Analizá el siguiente texto de una factura / lista de proveedor para un negocio del rubro "${rubro}".
Margen de ganancia deseado por defecto: ${margenDefecto}%.

Texto extraído:
"""
${textoOcr.slice(0, 4000)}
"""

Devolvé un JSON con este formato exacto:
{
  "proveedorDetectado": "Nombre de la distribuidora o proveedor si figura",
  "totalProductos": 3,
  "productos": [
    {
      "codigo": "7791234567890",
      "nombre": "Nombre descriptivo y limpio del producto",
      "categoria": "Bebidas",
      "costo": 1200,
      "precioSugerido": 1680,
      "margenPorcentaje": 40,
      "stockInicial": 12,
      "unidad": "unidad",
      "iva": 21
    }
  ],
  "sugerenciasIa": [
    "Consejo de compra o stock detectado"
  ]
}`

  try {
    const response = await aiService.chatJson<ScannerResultado>(
      [
        { role: "system", content: SYSTEM_PROMPT_CATALOGO },
        { role: "user", content: prompt },
      ],
      "batch"
    )

    if (response.data && Array.isArray(response.data.productos)) {
      return response.data
    }
  } catch (error) {
    console.error("[catalogo-scanner] Error procesando con IA:", error)
  }

  // Fallback heurístico simple si la IA no está disponible o falla el JSON
  const lineas = textoOcr.split("\n").filter((l) => l.trim().length > 3)
  const productosFallback: ProductoEscaneado[] = lineas.slice(0, 20).map((l, i) => {
    // Buscar números que parezcan precios
    const numeros = l.match(/\d+([.,]\d+)?/g)
    const costo = numeros && numeros.length > 0 ? parseFloat(numeros[numeros.length - 1].replace(",", ".")) : 1000
    const precio = Math.round(costo * (1 + margenDefecto / 100))
    return {
      codigo: `GEN-${Date.now()}-${i}`,
      nombre: l.replace(/\d+([.,]\d+)?/g, "").trim() || `Producto ${i + 1}`,
      categoria: "General",
      costo,
      precioSugerido: precio,
      margenPorcentaje: margenDefecto,
      stockInicial: 10,
      unidad: "unidad",
      iva: 21,
    }
  })

  return {
    proveedorDetectado: "Proveedor General",
    totalProductos: productosFallback.length,
    productos: productosFallback,
    sugerenciasIa: [
      "Productos importados con margen automático del " + margenDefecto + "%",
    ],
  }
}

/**
 * Importa los productos escaneados directamente a la base de datos del tenant
 */
export async function importarProductosEscaneados(
  empresaId: number,
  productos: ProductoEscaneado[]
) {
  let creados = 0
  const errores: string[] = []

  for (const p of productos) {
    try {
      const generatedCode = p.codigo || `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      await prisma.producto.create({
        data: {
          empresaId,
          codigo: generatedCode,
          nombre: p.nombre,
          precioVenta: p.precioSugerido,
          precioCompra: p.costo,
          stock: p.stockInicial || 0,
          porcentajeIva: p.iva || 21,
          unidad: p.unidad || "unidad",
          activo: true,
        },
      })
      creados++
    } catch (err) {
      errores.push(`Error en producto "${p.nombre}": ${err instanceof Error ? err.message : "desconocido"}`)
    }
  }

  return { creados, total: productos.length, errores }
}
