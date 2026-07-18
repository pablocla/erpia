import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { PrinterService } from "@/lib/printer/printer-service"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  productoId: z.number().int().positive().optional(),
  nombre: z.string().min(1).optional(),
  codigo: z.string().optional(),
  codigoBarras: z.string().optional(),
  precio: z.number().nonnegative().optional(),
  unidad: z.string().optional(),
  leyenda: z.string().optional(),
  cantidad: z.number().int().min(1).max(50).default(1),
})

/**
 * POST /api/impresion/etiqueta
 * Imprime etiqueta(s) de góndola en impresora Hasar/Epson activa.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    const empresaId = auth.auth.empresaId
    let nombre = parsed.data.nombre
    let codigo = parsed.data.codigo
    let codigoBarras = parsed.data.codigoBarras
    let precio = parsed.data.precio
    let unidad = parsed.data.unidad

    if (parsed.data.productoId) {
      const prod = await prisma.producto.findFirst({
        where: { id: parsed.data.productoId, empresaId },
        select: {
          nombre: true,
          codigo: true,
          codigoBarras: true,
          precioVenta: true,
          unidad: true,
        },
      })
      if (!prod) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
      }
      nombre = nombre ?? prod.nombre
      codigo = codigo ?? prod.codigo
      codigoBarras = codigoBarras ?? prod.codigoBarras ?? undefined
      precio = precio ?? Number(prod.precioVenta)
      unidad = unidad ?? prod.unidad ?? undefined
    }

    if (!nombre || precio == null) {
      return NextResponse.json(
        { error: "Indicá productoId o nombre + precio" },
        { status: 400 },
      )
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { nombre: true },
    })

    const printer = new PrinterService()
    const cantidad = parsed.data.cantidad
    let lastError: string | undefined

    for (let i = 0; i < cantidad; i++) {
      const result = await printer.imprimirEtiqueta(empresaId, {
        empresaNombre: empresa?.nombre ?? undefined,
        nombre,
        codigo,
        codigoBarras,
        precio,
        unidad,
        leyenda: parsed.data.leyenda,
      })
      if (!result.success) {
        lastError = result.error
        break
      }
    }

    if (lastError) {
      return NextResponse.json({ error: lastError }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mensaje: `${cantidad} etiqueta(s) enviada(s)`,
      cantidad,
    })
  } catch (error) {
    console.error("Error etiqueta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
