import { prisma } from "@/lib/prisma"

export interface SignUatPayload {
  empresaId: number
  signatureName: string
  signatureDate: string
  comments: string
}

export async function signUat(payload: SignUatPayload) {
  // En un entorno real se podría guardar una firma digital, un snapshot o
  // un documento (Acta) en formato PDF. Aquí marcamos el UAT como firmado
  // en la tabla de Empresa o en un registro de operaciones.
  
  // Por ahora lo guardaremos como un Log de Actividad
  const log = await (prisma as any).agenteLog.create({
    data: {
      empresaId: payload.empresaId,
      accion: "UAT_SIGNED",
      detalles: {
        signatureName: payload.signatureName,
        signatureDate: payload.signatureDate,
        comments: payload.comments,
        snapshotVersion: "1.0",
      },
    },
  })

  // También avanzamos el proyecto a Go-Live si existe
  const proyecto = await (prisma as any).proyectoImplementacion.findFirst({
    where: { empresaId: payload.empresaId }
  })

  if (proyecto) {
    await (prisma as any).proyectoImplementacion.update({
      where: { id: proyecto.id },
      data: { faseActual: "go-live" }
    })
  }
  
  return { success: true, logId: log.id }
}
