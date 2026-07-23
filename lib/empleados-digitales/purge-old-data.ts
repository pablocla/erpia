/**
 * INF-02: purga Usage y Runs antiguos (Supabase free / higiene).
 */

import { prisma } from "@/lib/prisma"

const DEFAULT_DAYS = 90

export async function purgeEmpleadoDigitalOldData(days = DEFAULT_DAYS) {
  const cutoff = new Date(Date.now() - days * 86_400_000)

  const [usage, runs] = await Promise.all([
    prisma.empleadoDigitalUsage.deleteMany({
      where: { createdAt: { lt: cutoff } },
    }),
    // Solo runs terminados viejos (no borrar running)
    prisma.empleadoDigitalRun.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ["success", "partial", "error", "skipped"] },
      },
    }),
  ])

  // Tareas viejas ya cerradas
  const tareas = await prisma.empleadoDigitalTarea.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      estado: { in: ["aprobada", "rechazada", "cancelada", "enviada", "error"] },
    },
  })

  return {
    cutoff: cutoff.toISOString(),
    deletedUsage: usage.count,
    deletedRuns: runs.count,
    deletedTareas: tareas.count,
  }
}
