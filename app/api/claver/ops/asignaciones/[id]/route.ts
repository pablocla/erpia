import { NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const idAsNumber = Number(id)
    if (isNaN(idAsNumber)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const db = prisma as any
    await db.analistaAsignacion.update({
      where: { id: idAsNumber },
      data: { activo: false, updatedAt: new Date() }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
