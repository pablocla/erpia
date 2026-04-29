import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── GET — List movimientos bancarios with summary ───────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId")
    const estado = searchParams.get("estado")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "100", 10), 500)

    let cuentaBancariaId: number | undefined
    if (cuentaId) {
      cuentaBancariaId = Number(cuentaId)
      if (Number.isNaN(cuentaBancariaId) || cuentaBancariaId <= 0) {
        return NextResponse.json({ error: "cuentaId inválido" }, { status: 400 })
      }
    }

    const movimientosWhere: Record<string, unknown> = {
      cuentaBancaria: whereEmpresa(ctx.auth.empresaId),
      tipo: { contains: "transf", mode: "insensitive" },
      ...(cuentaBancariaId ? { cuentaBancariaId } : {}),
      ...(estado ? { estado } : {}),
    }

    const [movimientos, total, cuentas] = await Promise.all([
      prisma.movimientoBancario.findMany({
        where: movimientosWhere,
        include: {
          cuentaBancaria: {
            select: { id: true, alias: true, cbu: true, tipo: true, banco: { select: { nombre: true } } },
          },
        },
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      prisma.movimientoBancario.count({ where: movimientosWhere }),
      prisma.cuentaBancaria.findMany({
        where: { empresaId: ctx.auth.empresaId, activo: true },
        select: { id: true, alias: true, cbu: true, tipo: true, banco: { select: { nombre: true } } },
      }),
    ])

    // Calculate summary
    const allMovs = await prisma.movimientoBancario.findMany({
      where: movimientosWhere,
      select: { tipo: true, importe: true, estado: true },
    })

    let saldo = 0
    let pendientes = 0
    let conciliados = 0
    for (const m of allMovs) {
      const imp = Number(m.importe)
      saldo += m.tipo === "credito" ? imp : -imp
      if (m.estado === "pendiente") pendientes++
      else conciliados++
    }

    return NextResponse.json({
      data: movimientos.map((m: any) => ({
        ...m,
        importe: Number(m.importe),
      })),
      total,
      skip,
      take,
      cuentas,
      resumen: {
        saldo: Math.round(saldo * 100) / 100,
        pendientes,
        conciliados,
        totalMovimientos: allMovs.length,
      },
    })
  } catch (error) {
    console.error("Error en GET banco:", error)
    logError("api/banco:GET", error, request)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Create movimiento bancario ───────────────────────────────────────

const movSchema = z.object({
  cuentaBancariaId: z.number().int().positive(),
  fecha: z.string(),
  tipo: z.enum(["credito", "debito"]),
  importe: z.number().positive(),
  descripcion: z.string().min(1),
  referencia: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = movSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { cuentaBancariaId, fecha, tipo, importe, descripcion, referencia } = validacion.data

    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaBancariaId },
      select: { id: true, empresaId: true },
    })
    if (!cuenta) return NextResponse.json({ error: "Cuenta bancaria no encontrada" }, { status: 404 })
    if (cuenta.empresaId !== ctx.auth.empresaId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const mov = await prisma.movimientoBancario.create({
      data: {
        cuentaBancariaId,
        fecha: new Date(fecha),
        tipo,
        importe,
        descripcion,
        referencia,
      },
    })

    return NextResponse.json({ ...mov, importe: Number(mov.importe) }, { status: 201 })
  } catch (error) {
    console.error("Error al crear movimiento bancario:", error)
    logError("api/banco:POST", error, request)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
