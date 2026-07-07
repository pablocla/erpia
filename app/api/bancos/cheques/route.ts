import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    // Fetch solo cheques de terceros en cartera
    const cheques = await prisma.cheque.findMany({
      where: {
        cliente: {
          empresaId: auth.auth.empresaId
        },
        tipoCheque: "tercero",
        estado: "cartera",
      },
      orderBy: { fechaVencimiento: "asc" }
    })

    return NextResponse.json(cheques)
  } catch (error) {
    console.error("Error al obtener cartera de cheques:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
