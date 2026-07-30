import { prisma } from "@/lib/prisma"
import { parsearListaDistribuidora, generarPropuestasLista, aplicarPropuestasLista } from "./lista-distribuidora-service"

export async function startImportJob(empresaId: number, csvContent: string): Promise<number> {
  // 1. Crear el Job en estado Pendiente
  const job = await prisma.backgroundJob.create({
    data: {
      empresaId,
      tipo: "ImportarListaDistribuidora",
      estado: "Procesando",
      progreso: 0,
    }
  })

  // 2. Disparar el procesamiento en background (Fire and Forget)
  // Nota: En un entorno Serverless puro (como Vercel) esto puede morir si demora más de 10-60s.
  // Para optimización "extrema" a escala, este jobId debería enviarse a Inngest o AWS SQS.
  // Por ahora lo simulamos asíncronamente.
  processImportInBackground(empresaId, job.id, csvContent).catch(console.error)

  return job.id
}

async function processImportInBackground(empresaId: number, jobId: number, csvContent: string) {
  try {
    // Fase 1: Parseo (10%)
    await updateJobProgress(jobId, 10, "Parseando archivo CSV...")
    const filas = parsearListaDistribuidora(csvContent)

    // Fase 2: Generar propuestas cruzando con DB (40%)
    await updateJobProgress(jobId, 40, "Calculando propuestas de precios...")
    const propuestasResult = await generarPropuestasLista(empresaId, filas)

    // Fase 3: Aplicar masivamente (90%)
    await updateJobProgress(jobId, 90, "Aplicando cambios en la base de datos en lotes (chunks)...")
    
    // Si la lista es muy grande, deberíamos chunkear `propuestasResult.propuestas`.
    // Como `aplicarPropuestasLista` ya usa prisma.producto.update, lo llamamos directamente.
    // Para optimización extrema, podríamos re-escribir `aplicarPropuestasLista` para hacer updateMany
    // pero requeriría raw SQL (ya que prisma no soporta updateMany con diferentes valores).
    
    const applyResult = await aplicarPropuestasLista(empresaId, propuestasResult.propuestas)

    // Completado (100%)
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        estado: "Completado",
        progreso: 100,
        resultado: {
          filasProcesadas: filas.length,
          propuestasAplicadas: applyResult.actualizados,
          productosNuevos: applyResult.creados
        }
      }
    })

  } catch (error: any) {
    console.error(`[BackgroundJob ${jobId} Failed]`, error)
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        estado: "Error",
        error: error.message || "Error desconocido al procesar la lista"
      }
    })
  }
}

async function updateJobProgress(jobId: number, progreso: number, mensaje: string) {
  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: { 
      progreso,
      resultado: { mensajeActual: mensaje }
    }
  })
}
