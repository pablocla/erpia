/**
 * /api/config/numeradores — Gestión de numeradores de documentos
 *
 * GET  ?empresaId=1            → lista todos los numeradores
 * PUT  { id, prefijo?, digitos?, activo? } → actualizar numerador
 * POST { empresaId, tipoDocumento, prefijo, digitos?, sucursal? } → crear nuevo
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = Number(searchParams.get("empresaId") || "1")

    const numeradores = await prisma.numerador.findMany({
      where: { empresaId },
      orderBy: { tipoDocumento: "asc" },
    })

    return NextResponse.json({ numeradores })
  } catch (error) {
    console.error("Error al obtener numeradores:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empresaId, tipoDocumento, prefijo, digitos, sucursal } = body

    if (!empresaId || !tipoDocumento || !prefijo) {
      return NextResponse.json({ error: "empresaId, tipoDocumento, prefijo requeridos" }, { status: 400 })
    }

    const numerador = await prisma.numerador.create({
      data: {
        empresaId,
        tipoDocumento,
        prefijo,
        digitos: digitos ?? 6,
        sucursal: sucursal ?? null,
      },
    })

    return NextResponse.json({ numerador }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un numerador con esa combinación empresa/tipo/sucursal" }, { status: 409 })
    }
    console.error("Error al crear numerador:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, prefijo, digitos, activo } = body

    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 })
    }

    const numerador = await prisma.numerador.update({
      where: { id },
      data: {
        ...(prefijo !== undefined ? { prefijo } : {}),
        ...(digitos !== undefined ? { digitos } : {}),
        ...(activo !== undefined ? { activo } : {}),
      },
    })

    return NextResponse.json({ numerador })
  } catch (error) {
    console.error("Error al actualizar numerador:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
