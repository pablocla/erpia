import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { resolveSku } from "./catalog-resolver"
import { getRunbookOrDefault } from "./product-runbooks"
import { crearTareaMarketplace, resolverAnalistaEmpresa } from "./analyst-task-service"
import { activarProducto } from "@/lib/platform/product-lifecycle"

const AUTO_LEVELS = new Set(["GLOBAL_AUTO", "REGION_AUTO"])

export async function provisionSku(empresaId: number, sku: string, opts?: { ordenId?: string; iniciadoPor?: string }) {
  const item = resolveSku(sku)
  if (!item) throw new Error(`SKU no encontrado: ${sku}`)

  const runbook = getRunbookOrDefault(sku, item.nombre, item.autoCertLevel)
  const started = Date.now()

  const job = await prisma.marketplaceProvisionJob.create({
    data: {
      empresaId,
      sku,
      estado: "running",
      pasoActual: 1,
      pasosJson: runbook.pasos.map((p) => ({
        orden: p.orden,
        titulo: p.titulo,
        ejecutor: p.ejecutor,
        done: false,
      })),
      metadata: {
        playbookId: item.playbookId,
        autoCertLevel: item.autoCertLevel,
        ordenId: opts?.ordenId,
        iniciadoPor: opts?.iniciadoPor,
      },
    },
  })

  const isFullyAuto = AUTO_LEVELS.has(item.autoCertLevel)

  try {
    if (isFullyAuto) {
      await ejecutarPasosAutomaticos(empresaId, sku, item.nombre)
      await marcarJobReady(job.id, Date.now() - started)
    } else {
      const tarea = await crearTareaMarketplace({
        empresaId,
        sku,
        nombre: item.nombre,
        autoCertLevel: item.autoCertLevel,
        provisionJobId: job.id,
      })

      await prisma.marketplaceProvisionJob.update({
        where: { id: job.id },
        data: {
          estado: "pending",
          metadata: {
            ...(typeof job.metadata === "object" && job.metadata ? job.metadata : {}),
            tareaAnalistaId: tarea.id,
            esperando: "analista",
          },
        },
      })

      await persistSistemaLog({
        empresaId,
        severidad: "info",
        modulo: "marketplace",
        mensaje: `Tarea analista creada para ${sku}`,
        metadata: { tareaId: tarea.id, asignadoA: tarea.asignadoA },
      })

      const analista = await resolverAnalistaEmpresa(empresaId)
      if (analista && process.env.RESEND_API_KEY) {
        try {
          const { emailService } = await import("@/lib/email/email-service")
          await emailService.enviar({
            to: analista,
            subject: `[Claver Cloud] Activar ${item.nombre} — empresa #${empresaId}`,
            html: `<p>Nueva tarea marketplace: <b>${item.nombre}</b> (${sku})</p><p>Claver Cloud → Marketplace → Torre de tareas</p>`,
            text: `Tarea: ${sku} empresa ${empresaId}`,
          })
        } catch {
          /* email opcional */
        }
      }
    }

    return { jobId: job.id, auto: isFullyAuto, sku, nombre: item.nombre }
  } catch (err) {
    await prisma.marketplaceProvisionJob.update({
      where: { id: job.id },
      data: { estado: "failed", errorMsg: String(err) },
    })

    await persistSistemaLog({
      empresaId,
      severidad: "error",
      modulo: "marketplace",
      mensaje: `Error en provisión de ${sku}: ${(err as Error).message}`,
    })

    throw err
  }
}

async function ejecutarPasosAutomaticos(empresaId: number, sku: string, nombre: string) {
  await activarProducto(empresaId, sku, "marketplace_auto")

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    modulo: "marketplace",
    mensaje: `Provisión auto iniciada para SKU ${sku} (${nombre}) activado automáticamente`,
  })
}

async function marcarJobReady(jobId: string, duracionMs: number) {
  const job = await prisma.marketplaceProvisionJob.findUnique({ where: { id: jobId } })
  const pasos = Array.isArray(job?.pasosJson) ? job.pasosJson : []
  const done = (pasos as { orden?: number; titulo?: string; done?: boolean }[]).map((p) => ({
    ...p,
    done: true,
  }))

  await prisma.marketplaceProvisionJob.update({
    where: { id: jobId },
    data: {
      estado: "ready",
      pasoActual: done.length,
      pasosJson: done,
      duracionMs,
    },
  })
}

/** Analista completó tarea → activar suscripción y cerrar job */
export async function finalizarProvisionManual(provisionJobId: string, tareaId: string, notas?: string) {
  const job = await prisma.marketplaceProvisionJob.findUnique({ where: { id: provisionJobId } })
  if (!job) throw new Error("Job no encontrado")

  const started = job.createdAt.getTime()

  await activarProducto(job.empresaId, job.sku, "marketplace_analista")

  await prisma.marketplaceTareaAnalista.update({
    where: { id: tareaId },
    data: { estado: "completada", completadaAt: new Date(), notas },
  })

  await marcarJobReady(provisionJobId, Date.now() - started)

  await persistSistemaLog({
    empresaId: job.empresaId,
    severidad: "info",
    modulo: "marketplace",
    mensaje: `SKU ${job.sku} activado por analista (tarea ${tareaId})`,
  })

  return { ok: true }
}

export async function provisionOrden(empresaId: number, ordenId: string) {
  const orden = await prisma.marketplaceOrden.findFirst({
    where: { id: ordenId, empresaId },
  })
  if (!orden || orden.estado !== "paid") throw new Error("Orden no pagada")

  const items = orden.items as { sku: string; cantidad?: number }[]
  const results = []
  for (const item of items) {
    const r = await provisionSku(empresaId, item.sku, { ordenId, iniciadoPor: "checkout" })
    results.push(r)
  }
  return results
}