import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  generarCITIVentas,
  generarCITICompras,
  listarGeneracionesCITI,
} from "@/lib/impuestos/citi-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const generaciones = await listarGeneracionesCITI(authResult.auth.empresaId)
  return NextResponse.json(generaciones)
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const body = await request.json()
  const tipo = body.tipo as "ventas" | "compras"
  const periodo = body.periodo as string

  if (!tipo || !periodo) {
    return NextResponse.json({ error: "tipo y periodo requeridos" }, { status: 400 })
  }

  if (!periodo.match(/^\d{4}-\d{2}$/)) {
    return NextResponse.json({ error: "Formato de periodo inválido. Usar YYYY-MM" }, { status: 400 })
  }

  const resultado = tipo === "ventas"
    ? await generarCITIVentas(empresaId, periodo)
    : await generarCITICompras(empresaId, periodo)

  return new Response(resultado.contenido, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resultado.nombreArchivo}"`,
    },
  })
}
