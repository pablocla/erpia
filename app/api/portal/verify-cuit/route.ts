import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  cuit: z.string().min(10).max(13),
  empresaId: z.number().int().positive(),
})

/**
 * POST /api/portal/verify-cuit
 * Verifica que el CUIT pertenece a un cliente activo de la empresa.
 * En producción, agregar modelo PortalUsuario con hash de contraseña.
 * Por ahora: acceso solo con CUIT (autenticación mínima viable).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const { cuit, empresaId } = parsed.data

    const cliente = await prisma.cliente.findFirst({
      where: {
        cuit: { contains: cuit.replace(/-/g, "") },
        empresaId,
        activo: true,
        deletedAt: null,
      },
      select: {
        id: true,
        nombre: true,
        cuit: true,
        saldoCuentaCorriente: true,
        limiteCredito: true,
        condicionIva: true,
        email: true,
        telefono: true,
      },
    })

    if (!cliente) {
      return NextResponse.json(
        { error: "No encontramos un cliente activo con ese CUIT. Contactá a tu vendedor." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      cliente: {
        ...cliente,
        saldoCuentaCorriente: Number(cliente.saldoCuentaCorriente),
        limiteCredito: Number(cliente.limiteCredito),
      },
    })
  } catch (error) {
    console.error("portal/verify-cuit:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
