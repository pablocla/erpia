import { prisma } from "@/lib/prisma"

const DEFAULT_EMPRESA_ID = 1

/**
 * Servicio de campos personalizados (EAV pattern).
 * Permite agregar campos dinámicos a cualquier entidad sin migrar schema.
 */
export const campoPersonalizadoService = {
  async listarCampos(entidad: string, empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.campoPersonalizado.findMany({
      where: { empresaId, entidad, activo: true },
      orderBy: { orden: "asc" },
    })
  },

  async crearCampo(data: {
    entidad: string
    nombreCampo: string
    etiqueta: string
    tipoDato: string
    requerido?: boolean
    valorDefecto?: string
    opciones?: unknown
    orden?: number
    grupo?: string
  }, empresaId = DEFAULT_EMPRESA_ID) {
    return prisma.campoPersonalizado.create({
      data: { ...data, opciones: data.opciones ? JSON.stringify(data.opciones) : undefined, empresaId },
    })
  },

  async actualizarCampo(id: number, data: {
    etiqueta?: string
    tipoDato?: string
    requerido?: boolean
    valorDefecto?: string
    opciones?: unknown
    orden?: number
    grupo?: string
  }, empresaId: number) {
    const campo = await prisma.campoPersonalizado.findFirst({ where: { id, empresaId } })
    if (!campo) throw new Error("Campo no encontrado")

    return prisma.campoPersonalizado.update({
      where: { id },
      data: { ...data, opciones: data.opciones ? JSON.stringify(data.opciones) : undefined },
    })
  },

  async eliminarCampo(id: number, empresaId: number) {
    const result = await prisma.campoPersonalizado.updateMany({
      where: { id, empresaId },
      data: { activo: false },
    })
    if (result.count === 0) throw new Error("Campo no encontrado")
    return result
  },

  // ─── VALORES ────────────────────────────────────────────────────────
  async obtenerValores(entidad: string, registroId: number) {
    return prisma.valorCampoPersonalizado.findMany({
      where: { entidadId: String(registroId), campo: { entidad } },
      include: { campo: true },
    })
  },

  async guardarValor(campoId: number, registroId: number, valor: {
    valorTexto?: string
    valorNumero?: number
    valorFecha?: Date
    valorBooleano?: boolean
    valorJson?: unknown
  }) {
    const entidadId = String(registroId)
    const existing = await prisma.valorCampoPersonalizado.findUnique({
      where: { campoId_entidadId: { campoId, entidadId } },
    })
    const data = { ...valor, valorJson: valor.valorJson ? JSON.stringify(valor.valorJson) : undefined }
    if (existing) {
      return prisma.valorCampoPersonalizado.update({ where: { id: existing.id }, data })
    }
    return prisma.valorCampoPersonalizado.create({ data: { campoId, entidadId, ...data } })
  },

  async guardarValoresBulk(registroId: number, valores: { campoId: number; valorTexto?: string; valorNumero?: number; valorFecha?: Date; valorBooleano?: boolean }[]) {
    const entidadId = String(registroId)
    const ops = valores.map((v) =>
      prisma.valorCampoPersonalizado.upsert({
        where: { campoId_entidadId: { campoId: v.campoId, entidadId } },
        update: v,
        create: { ...v, entidadId },
      }),
    )
    return prisma.$transaction(ops)
  },
}
