/**
 * /api/config/parametros-fiscales — CRUD parámetros fiscales
 *
 * GET  ?empresaId=1                     → lista todos
 * GET  ?empresaId=1&categoria=fiscal    → filtrar por categoría
 * POST { empresaId, clave, valor, descripcion?, categoria?, pais?, normativa?, vigenciaDesde?, vigenciaHasta? }
 * PUT  { id, valor, descripcion?, vigenciaHasta? }
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { invalidateConfigCache } from "@/lib/config/parametro-service"
import { auditService } from "@/lib/config/audit-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = Number(searchParams.get("empresaId") || "1")
    const categoria = searchParams.get("categoria")

    const parametros = await prisma.parametroFiscal.findMany({
      where: {
        empresaId,
        activo: true,
        ...(categoria ? { categoria } : {}),
      },
      orderBy: [{ categoria: "asc" }, { clave: "asc" }],
    })

    return NextResponse.json({ parametros })
  } catch (error) {
    console.error("Error al obtener parámetros fiscales:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empresaId, clave, valor, descripcion, categoria, pais, normativa, vigenciaDesde, vigenciaHasta } = body

    if (!empresaId || !clave || valor === undefined) {
      return NextResponse.json({ error: "empresaId, clave y valor requeridos" }, { status: 400 })
    }

    const parametro = await prisma.parametroFiscal.create({
      data: {
        empresaId,
        clave,
        valor,
        descripcion,
        categoria: categoria ?? "fiscal",
        pais: pais ?? null,
        normativa: normativa ?? null,
        vigenciaDesde: vigenciaDesde ? new Date(vigenciaDesde) : null,
        vigenciaHasta: vigenciaHasta ? new Date(vigenciaHasta) : null,
      },
    })

    invalidateConfigCache()

    // Audit trail
    const usuario = await verificarToken(request).catch(() => null)
    await auditService.logParametroCambio({
      parametroId: parametro.id,
      clave,
      valorAnterior: null,
      valorNuevo: valor,
      usuarioId: usuario?.id,
    }).catch(() => {})

    return NextResponse.json({ parametro }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un parámetro con esa clave para esta empresa/país" }, { status: 409 })
    }
    console.error("Error al crear parámetro fiscal:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, valor, descripcion, vigenciaHasta, activo } = body

    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 })
    }

    // Get previous value for audit
    const anterior = await prisma.parametroFiscal.findUnique({ where: { id } })

    const parametro = await prisma.parametroFiscal.update({
      where: { id },
      data: {
        ...(valor !== undefined ? { valor } : {}),
        ...(descripcion !== undefined ? { descripcion } : {}),
        ...(vigenciaHasta !== undefined ? { vigenciaHasta: vigenciaHasta ? new Date(vigenciaHasta) : null } : {}),
        ...(activo !== undefined ? { activo } : {}),
      },
    })

    invalidateConfigCache()

    // Audit trail
    if (valor !== undefined && anterior) {
      const usuario = await verificarToken(request).catch(() => null)
      await auditService.logParametroCambio({
        parametroId: parametro.id,
        clave: parametro.clave,
        valorAnterior: String(anterior.valor),
        valorNuevo: valor,
        usuarioId: usuario?.id,
      }).catch(() => {})
    }

    return NextResponse.json({ parametro })
  } catch (error) {
    console.error("Error al actualizar parámetro fiscal:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
