import { type NextRequest, NextResponse } from "next/server"
import { estadosFinancierosService } from "@/lib/contabilidad/estados-financieros-service"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const empresaId = usuario.empresaId ?? 1

    const ejercicios = await prisma.ejercicioContable.findMany({
      where: { empresaId },
      orderBy: { fechaInicio: "desc" },
    })

    return NextResponse.json({ success: true, ejercicios })
  } catch (error) {
    console.error("Error al obtener ejercicios:", error)
    return NextResponse.json({ error: "Error al obtener ejercicios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const empresaId = usuario.empresaId ?? 1
    const body = await request.json()

    if (body.accion === "cerrar") {
      const resultado = await estadosFinancierosService.cerrarEjercicio(body.ejercicioId, empresaId)
      return NextResponse.json({ success: true, ...resultado })
    }

    // Create new exercise
    const ejercicio = await prisma.ejercicioContable.create({
      data: {
        nombre: body.nombre,
        fechaInicio: new Date(body.fechaInicio),
        fechaFin: new Date(body.fechaFin),
        empresaId,
      },
    })

    return NextResponse.json({ success: true, ejercicio }, { status: 201 })
  } catch (error: any) {
    console.error("Error en cierre de ejercicio:", error)
    return NextResponse.json({ error: error.message ?? "Error en operación" }, { status: 500 })
  }
}
