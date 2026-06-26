import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { id } = await params

  const job = await prisma.marketplaceProvisionJob.findFirst({
    where: { id, ...whereEmpresa(auth.auth.empresaId) },
  })

  if (!job) {
    return NextResponse.json({ error: "Job no encontrado" }, { status: 404 })
  }

  return NextResponse.json({
    id: job.id,
    sku: job.sku,
    estado: job.estado,
    pasoActual: job.pasoActual,
    pasosJson: job.pasosJson,
    errorMsg: job.errorMsg,
    duracionMs: job.duracionMs,
    metadata: job.metadata,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  })
}