import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, payload } = body as {
      type?: string
      payload?: { deployment?: { id?: string; url?: string; meta?: { githubCommitSha?: string } } }
    }

    if (type !== "deployment.succeeded" && type !== "deployment.error") {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const deployId = payload?.deployment?.id
    if (!deployId) {
      return NextResponse.json({ ok: false, error: "deployment.id ausente" }, { status: 400 })
    }

    const db = prisma as any
    const jobs = await db.opsJob.findMany({
      where: {
        tipo: { in: ["deploy", "restart_app"] },
        estado: "en_progreso",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const matched = jobs.filter((job: { resultado?: Record<string, unknown> | null }) => {
      const r = job.resultado
      return r?.vercelDeploymentId === deployId || r?.id === deployId
    })

    const succeeded = type === "deployment.succeeded"
    const commitSha = payload?.deployment?.meta?.githubCommitSha?.slice(0, 7)

    for (const job of matched) {
      await db.opsJob.update({
        where: { id: job.id },
        data: {
          estado: succeeded ? "completado" : "error",
          finishedAt: new Date(),
          errorMsg: succeeded ? null : "Deploy falló (webhook Vercel)",
          resultado: {
            ...(job.resultado as object),
            vercelUrl: payload?.deployment?.url,
            webhookType: type,
            commitSha,
          },
        },
      })

      if (job.entornoId) {
        await db.tenantEntorno.update({
          where: { id: job.entornoId },
          data: {
            estado: succeeded ? "activo" : "error",
            version: commitSha ?? undefined,
            urlBase: payload?.deployment?.url ?? undefined,
            updatedAt: new Date(),
          },
        })
      }

      await persistSistemaLog({
        empresaId: job.empresaId,
        entornoId: job.entornoId ?? undefined,
        severidad: succeeded ? "info" : "error",
        categoria: "ops",
        contexto: `job:${job.id}`,
        mensaje: succeeded
          ? `Deploy Vercel ${deployId} completado`
          : `Deploy Vercel ${deployId} falló`,
        metadata: { deployId, type },
      })
    }

    return NextResponse.json({ ok: true, matched: matched.length })
  } catch {
    return NextResponse.json({ ok: false, error: "Bad Request" }, { status: 400 })
  }
}