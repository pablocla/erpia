import { type NextRequest, NextResponse } from "next/server"
import { IVAService } from "@/lib/impuestos/iva-service"
import { verificarToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")

    if (!mes || !anio) {
      return NextResponse.json({ error: "mes y anio son requeridos" }, { status: 400 })
    }

    const ivaService = new IVAService()
    const archivo = await ivaService.generarArchivoPresentacionAFIP(Number.parseInt(mes), Number.parseInt(anio))

    return new NextResponse(archivo, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="presentacion-iva-${mes}-${anio}.txt"`,
      },
    })
  } catch (error) {
    console.error("Error al generar archivo de presentación:", error)
    return NextResponse.json({ error: "Error al generar archivo de presentación" }, { status: 500 })
  }
}
