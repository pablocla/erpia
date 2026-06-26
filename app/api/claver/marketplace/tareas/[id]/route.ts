import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystContext, canAnalystAccessEmpresa } from "@/lib/auth/claver-analyst"
import { prisma } from "@/lib/prisma"
import { finalizarProvisionManual } from "@/lib/marketplace/provision-service"
import { getRunbookOrDefault } from "@/lib/marketplace/product-runbooks"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"

const patchSchema = z.object({
  accion: z.enum(["iniciar", "completar", "escalar"]),
  notas: z.string().optional(),
  checklistJson: z.array(z.unknown()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const tarea = await prisma.marketplaceTareaAnalista.findUnique({
    where: { id },
    include: { empresa: { select: { id: true, nombre: true, razonSocial: true, cuit: true } } },
  })

  if (!tarea) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
  }

  const allowed = await canAnalystAccessEmpresa(ctx.auth.email, tarea.empresaId)
  if (!allowed) {
    return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
  }

  const item = resolveSku(tarea.sku)
  const runbook = getRunbookOrDefault(tarea.sku, item?.nombre ?? tarea.sku, item?.autoCertLevel ?? "SEMI_AUTO")

  return NextResponse.json({ ...tarea, producto: item, runbook })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const tarea = await prisma.marketplaceTareaAnalista.findUnique({ where: { id } })
  if (!tarea) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
  }

  const allowed = await canAnalystAccessEmpresa(ctx.auth.email, tarea.empresaId)
  if (!allowed) {
    return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
  }

  const { accion, notas, checklistJson } = parsed.data

  if (accion === "iniciar") {
    const updated = await prisma.marketplaceTareaAnalista.update({
      where: { id },
      data: {
        estado: "en_curso",
        asignadoA: ctx.auth.email,
        checklistJson: checklistJson ?? tarea.checklistJson ?? undefined,
      },
    })
    return NextResponse.json(updated)
  }

  if (accion === "escalar") {
    const updated = await prisma.marketplaceTareaAnalista.update({
      where: { id },
      data: { estado: "escalada", notas: notas ?? tarea.notas ?? undefined },
    })
    return NextResponse.json(updated)
  }

  if (accion === "completar") {
    if (tarea.provisionJobId) {
      await finalizarProvisionManual(tarea.provisionJobId, id, notas)
    } else {
      await prisma.marketplaceTareaAnalista.update({
        where: { id },
        data: {
          estado: "completada",
          completadaAt: new Date(),
          notas: notas ?? undefined,
          checklistJson: checklistJson ?? tarea.checklistJson ?? undefined,
        },
      })
    }

    const updated = await prisma.marketplaceTareaAnalista.findUnique({ where: { id } })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Acción no soportada" }, { status: 400 })
}