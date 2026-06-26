import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  listarAprobacionesPendientes,
  resolverAprobacionWorkflow,
} from "@/lib/config/workflow-approval-queue"
import { WorkflowEngine } from "@/lib/config/workflow-engine"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const pendientes = await listarAprobacionesPendientes(auth.auth.empresaId)
  return NextResponse.json(pendientes)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const instanciaId = Number(body.instanciaId)
  if (!instanciaId) {
    return NextResponse.json({ error: "instanciaId requerido" }, { status: 400 })
  }

  const resolucion = await resolverAprobacionWorkflow(auth.auth.empresaId, instanciaId, {
    aprobado: !!body.aprobado,
    userId: auth.auth.userId,
    comentario: body.comentario,
  })

  if (resolucion.estado === "en_curso") {
    const engine = new WorkflowEngine(auth.auth.empresaId)
    const continuacion = await engine.reanudar(instanciaId)
    return NextResponse.json({ ...resolucion, continuacion })
  }

  return NextResponse.json(resolucion)
}