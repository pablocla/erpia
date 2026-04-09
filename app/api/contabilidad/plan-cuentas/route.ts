import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { PLAN_CUENTAS } from "@/lib/contabilidad/plan-cuentas"
import { z } from "zod"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  // Prefer DB-backed CuentaContable; fallback to legacy hardcoded array
  try {
    const cuentasDB = await prisma.cuentaContable.findMany({
      where: whereEmpresa(ctx.auth.empresaId, { activo: true }),
      orderBy: { codigo: "asc" },
    })

    if (cuentasDB.length > 0) {
      return NextResponse.json({
        success: true,
        fuente: "db",
        cuentas: cuentasDB.map(c => ({
          id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          tipo: c.tipo,
          categoria: c.categoria ?? c.tipo,
          nivel: c.nivel,
          imputable: c.imputable,
          parentId: c.parentId,
        })),
      })
    }
  } catch {
    // DB unavailable — fallback
  }

  return NextResponse.json({
    success: true,
    fuente: "legacy",
    cuentas: PLAN_CUENTAS,
  })
}

const cuentaSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio"),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  tipo: z.enum(["activo", "pasivo", "patrimonio", "ingreso", "egreso"]),
  categoria: z.string().min(1, "La categoría es obligatoria"),
  nivel: z.number().int().min(1).max(6).optional().default(3),
  imputable: z.boolean().optional().default(true),
  parentId: z.number().int().positive().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const validacion = cuentaSchema.safeParse(body)
  if (!validacion.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
  }

  const { codigo, nombre, tipo, categoria, nivel, imputable, parentId } = validacion.data

  // Check unique constraint (empresaId, codigo)
  const existe = await prisma.cuentaContable.findFirst({
    where: whereEmpresa(ctx.auth.empresaId, { codigo }),
  })
  if (existe) {
    return NextResponse.json({ error: `Ya existe una cuenta con código ${codigo}` }, { status: 409 })
  }

  // If parentId supplied, verify it belongs to same empresa
  if (parentId) {
    const parent = await prisma.cuentaContable.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parentId }),
    })
    if (!parent) {
      return NextResponse.json({ error: "La cuenta padre no existe" }, { status: 400 })
    }
  }

  const cuenta = await prisma.cuentaContable.create({
    data: {
      codigo,
      nombre,
      tipo,
      categoria,
      nivel,
      imputable,
      parentId: parentId ?? null,
      empresaId: ctx.auth.empresaId,
    },
  })

  return NextResponse.json({
    success: true,
    cuenta: {
      id: cuenta.id,
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      categoria: cuenta.categoria,
      nivel: cuenta.nivel,
      imputable: cuenta.imputable,
      parentId: cuenta.parentId,
    },
  }, { status: 201 })
}
