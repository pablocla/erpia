import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { reexpresarPreciosProductos } from "@/lib/inflacion/reexpresar-precios"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  modo: z.enum(["porcentaje", "ipc"]),
  porcentaje: z.number().min(-90).max(500).optional(),
  indiceCodigo: z.enum(["IPC_NACIONAL", "IPC_GBA", "UVA", "MANUAL"]).optional(),
  fechaOrigen: z.string().optional(),
  fechaValuacion: z.string().optional(),
  productoIds: z.array(z.number().int().positive()).optional(),
  categoriaId: z.number().int().positive().optional(),
  ajustarCosto: z.boolean().optional(),
  topeVariacion: z.number().min(0).max(5).optional(),
  dryRun: z.boolean().optional().default(true),
  decimales: z.number().int().min(0).max(2).optional(),
})

/**
 * POST /api/productos/reexpresar-precios
 * Reexpresa precios por % o IPC. dryRun=true por defecto (preview).
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (parsed.data.modo === "porcentaje" && parsed.data.porcentaje == null) {
    return NextResponse.json({ error: "porcentaje requerido en modo porcentaje" }, { status: 400 })
  }

  try {
    const result = await reexpresarPreciosProductos({
      empresaId: auth.auth.empresaId,
      modo: parsed.data.modo,
      porcentaje: parsed.data.porcentaje,
      indiceCodigo: parsed.data.indiceCodigo,
      fechaOrigen: parsed.data.fechaOrigen,
      fechaValuacion: parsed.data.fechaValuacion,
      productoIds: parsed.data.productoIds,
      categoriaId: parsed.data.categoriaId,
      ajustarCosto: parsed.data.ajustarCosto,
      topeVariacion: parsed.data.topeVariacion,
      dryRun: parsed.data.dryRun,
      decimales: parsed.data.decimales,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error("[reexpresar-precios]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al reexpresar precios" },
      { status: 400 },
    )
  }
}

/** GET categorías + conteo productos activos (helper UI) */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const [totalProductos, categorias] = await Promise.all([
    prisma.producto.count({
      where: { ...whereEmpresa(auth.auth.empresaId), activo: true },
    }),
    prisma.categoria.findMany({
      where: whereEmpresa(auth.auth.empresaId),
      select: { id: true, nombre: true, _count: { select: { productos: true } } },
      orderBy: { nombre: "asc" },
      take: 200,
    }),
  ])

  return NextResponse.json({
    totalProductos,
    categorias: categorias.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      productos: c._count.productos,
    })),
  })
}
