import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { prisma } from "@/lib/prisma"
import { updateMilestoneEstado, partnerNetFromCobrado } from "@/lib/works/works-service"
import type { WorksMilestoneEstado } from "@prisma/client"
import { Prisma } from "@prisma/client"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const project = await prisma.worksProject.findUnique({
    where: { id },
    include: { milestones: true },
  })
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const comisionPct = Number(project.comisionPct)
  const milestones = project.milestones.map((m) => {
    const cobrado = m.monto != null ? Number(m.monto) : 0
    return {
      ...m,
      partnerNet: partnerNetFromCobrado(cobrado, comisionPct),
      comisionPct,
    }
  })
  return NextResponse.json({ ok: true, milestones, comisionPct })
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  try {
    const body = await request.json()
    if (!body.milestoneId || !body.estado) throw new Error("milestoneId y estado son obligatorios")
    // ensure milestone belongs to project
    const m = await prisma.worksMilestone.findFirst({
      where: { id: body.milestoneId, projectId: id },
    })
    if (!m) throw new Error("Hito no pertenece al proyecto")
    const updated = await updateMilestoneEstado(body.milestoneId, body.estado as WorksMilestoneEstado)
    if (body.monto != null) {
      await prisma.worksMilestone.update({
        where: { id: body.milestoneId },
        data: { monto: new Prisma.Decimal(Number(body.monto)) },
      })
    }
    return NextResponse.json({ ok: true, milestone: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
