import { prisma } from "@/lib/prisma"

export interface FiscalEmissionContext {
  jurisdiccion: string
  emisorAgente: {
    esAgentePercepcionIVA: boolean
    esAgentePercepcionIIBB: boolean
  }
}

/** Contexto fiscal de la empresa para percepciones y tributos en emisión AFIP */
export async function getFiscalEmissionContext(empresaId: number): Promise<FiscalEmissionContext> {
  const config = await prisma.configFiscalEmpresa.findUnique({
    where: { empresaId },
    include: {
      inscripcionesIIBB: { where: { activo: true }, orderBy: { id: "asc" }, take: 1 },
    },
  })

  return {
    jurisdiccion: config?.inscripcionesIIBB[0]?.jurisdiccion ?? "PBA",
    emisorAgente: {
      esAgentePercepcionIVA: config?.esAgentePercepcionIVA ?? false,
      esAgentePercepcionIIBB: config?.esAgentePercepcionIIBB ?? false,
    },
  }
}