import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const jobId = parseInt((await params).id, 10)
  if (isNaN(jobId)) {
    return NextResponse.json({ error: "ID de Job inválido" }, { status: 400 })
  }

  try {
    const job = await prisma.backgroundJob.findUnique({
      where: {
        id: jobId,
        ...whereEmpresa(ctx.auth.empresaId),
      },
      select: {
        id: true,
        tipo: true,
        estado: true,
        progreso: true,
        resultado: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!job) {
      return NextResponse.json({ error: "Job no encontrado" }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error(`[API_JOBS_GET]`, error)
    return NextResponse.json({ error: "Error al obtener estado del Job" }, { status: 500 })
  }
}
