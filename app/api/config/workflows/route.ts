import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { WorkflowEngine } from "@/lib/config/workflow-engine"
import { getWorkflowsConPasos } from "@/lib/config/configuracion-feature-service"

// GET — Listar workflows del rubro de la empresa, o instancias en vuelo
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(req.url)
  const modo = searchParams.get("modo") // "templates" | "instancias"

  if (modo === "instancias") {
    const instancias = await prisma.workflowInstancia.findMany({
      where: { empresaId: ctx.auth.empresaId },
      include: { pasoLog: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json(instancias)
  }

  // Default: templates del rubro
  const empresa = await prisma.empresa.findUnique({
    where: { id: ctx.auth.empresaId },
    select: { rubroId: true },
  })

  if (!empresa?.rubroId) {
    return NextResponse.json([])
  }

  const workflows = await getWorkflowsConPasos(empresa.rubroId)
  return NextResponse.json(workflows)
}

// POST — Ejecutar un workflow
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const body = await req.json()
  const { proceso, contexto } = body as { proceso: string; contexto?: Record<string, unknown> }

  if (!proceso) {
    return NextResponse.json({ error: "proceso requerido" }, { status: 400 })
  }

  const engine = new WorkflowEngine(ctx.auth.empresaId)
  const result = await engine.ejecutar(proceso, contexto ?? {})

  return NextResponse.json(result)
}
