import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No se seleccionaron cheques" }, { status: 400 })
    }

    // Verify ownership
    const cheques = await prisma.cheque.findMany({
      where: {
        id: { in: ids },
        cliente: { empresaId: auth.auth.empresaId }
      }
    })

    if (cheques.length !== ids.length) {
      return NextResponse.json({ error: "Algunos cheques no pertenecen a la empresa o no existen" }, { status: 403 })
    }

    if (action === "rechazar") {
      await prisma.cheque.updateMany({
        where: { id: { in: ids } },
        data: { estado: "rechazado" }
      })
    } else if (action === "depositar") {
      await prisma.$transaction(async (tx) => {
        // Find first bank account (idealmente se pasaría por parámetro)
        const cuenta = await tx.cuentaBancaria.findFirst({
          where: { empresaId: auth.auth.empresaId, activa: true }
        })

        if (!cuenta) throw new Error("No hay cuenta bancaria configurada")

        await tx.cheque.updateMany({
          where: { id: { in: ids } },
          data: { estado: "depositado", cuentaDepositoId: cuenta.id }
        })

        // Generar movimiento bancario consolidado
        const total = cheques.reduce((acc, c) => acc + Number(c.monto), 0)
        await tx.movimientoBancario.create({
          data: {
            cuentaId: cuenta.id,
            fecha: new Date(),
            tipo: "credito",
            importe: total,
            descripcion: `Depósito masivo de ${cheques.length} cheques de terceros`
          }
        })
      })
    } else {
      return NextResponse.json({ error: "Acción no soportada" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en bulk-action cheques:", error)
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
