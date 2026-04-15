import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  registrarCoeficiente,
  calcularAjusteInflacion,
  aplicarAjuste,
  listarAjustes,
} from "@/lib/contabilidad/inflacion-service"

// GET — Listar ajustes por inflación
export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const ajustes = await listarAjustes(auth.empresaId)
  return NextResponse.json({ success: true, data: ajustes })
}

// POST — Registrar coeficiente, calcular ajuste o aplicar
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const body = await request.json()

  if (body.accion === "coeficiente") {
    const ajuste = await registrarCoeficiente({
      empresaId: auth.empresaId,
      periodo: body.periodo,
      coeficiente: body.coeficiente,
      indice: body.indice,
    })
    return NextResponse.json({ success: true, data: ajuste }, { status: 201 })
  }

  if (body.accion === "calcular") {
    const resultado = await calcularAjusteInflacion(auth.empresaId, body.periodo)
    return NextResponse.json({ success: true, data: resultado })
  }

  if (body.accion === "aplicar") {
    const resultado = await aplicarAjuste(auth.empresaId, body.ajusteId)
    return NextResponse.json({ success: true, data: resultado })
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}
