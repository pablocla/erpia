import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  evaluarExpresion,
  evaluarFormulaPorCodigo,
  listFormulas,
  seedFormulasEmpresa,
} from "@/lib/nicho/formula-calculo-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const formulas = await listFormulas(auth.auth.empresaId)
  return NextResponse.json(formulas)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()

  if (body.action === "seed") {
    await seedFormulasEmpresa(auth.auth.empresaId)
    return NextResponse.json({ ok: true })
  }

  if (body.codigo && body.valores) {
    const result = await evaluarFormulaPorCodigo(
      auth.auth.empresaId,
      body.codigo,
      body.valores,
    )
    return NextResponse.json(result)
  }

  if (body.expresion && body.valores) {
    const resultado = evaluarExpresion({
      expresion: body.expresion,
      valores: body.valores,
    })
    return NextResponse.json({ resultado })
  }

  return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
}