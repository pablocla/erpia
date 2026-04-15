import { prisma } from "@/lib/prisma"

const DEFAULT_EMPRESA_ID = 1

/**
 * Servicio de configuración de campos por entidad.
 * Permite definir qué campos son visibles, obligatorios o solo-lectura
 * en cada formulario, por empresa.
 */
export const configuracionCampoService = {
  async listarConfiguracion(entidad: string, empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.configuracionCampo.findMany({
      where: { empresaId, entidad },
      orderBy: { orden: "asc" },
    })
  },

  async upsertConfiguracion(data: {
    entidad: string
    campo: string
    visible?: boolean
    obligatorio?: boolean
    soloLectura?: boolean
    valorDefault?: string
    orden?: number
  }, empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.configuracionCampo.upsert({
      where: { empresaId_entidad_campo: { empresaId, entidad: data.entidad, campo: data.campo } },
      update: data,
      create: { ...data, empresaId },
    })
  },

  async upsertBulk(entidad: string, configs: {
    campo: string
    visible?: boolean
    obligatorio?: boolean
    soloLectura?: boolean
    valorDefault?: string
    orden?: number
  }[], empresaId = DEFAULT_EMPRESA_ID) {
    const ops = configs.map((c) =>
      prisma.configuracionCampo.upsert({
        where: { empresaId_entidad_campo: { empresaId, entidad, campo: c.campo } },
        update: c,
        create: { ...c, entidad, empresaId },
      }),
    )
    return prisma.$transaction(ops)
  },

  async eliminar(id: number) {
    return prisma.configuracionCampo.delete({ where: { id } })
  },
}
